import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@cp/db";
import { officialMediaSubmissionSchema } from "@cp/shared";
import { ApiError, handler } from "@/lib/api";

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "creator";
const duration = (value?: string) => value ? value.split(":").reduce((total, part) => total * 60 + Number(part), 0) : null;

export const POST = handler({ auth: true, limit: [10, 3600] }, async ({ req, user }) => {
  if (!user) throw new ApiError(401, "unauthorized");
  if (Number(req.headers.get("content-length") ?? 0) > 100_000) throw new ApiError(413, "request_too_large");
  let input: Record<string, unknown>;
  if (req.headers.get("content-type")?.includes("application/json")) {
    try { input = z.record(z.string(), z.unknown()).parse(await req.json()); } catch { throw new ApiError(400, "invalid_json"); }
  } else {
    let form: FormData;
    try { form = await req.formData(); } catch { throw new ApiError(400, "invalid_form"); }
    const file = form.get("file");
    if (file && typeof file !== "string" && file.size > 0) throw new ApiError(503, "private_upload_storage_not_configured");
    input = Object.fromEntries(form.entries());
  }
  const person = input.artist ?? input.speaker;
  const data = officialMediaSubmissionSchema.parse({ ...input, artist: person, speaker: person, rightsConfirmed: input.rightsConfirmed === true || input.rightsConfirmed === "on" || input.rightsConfirmed === "true" });
  const created = await prisma.$transaction(async (tx) => {
    const links = [{ provider: data.provider, url: data.url }];
    let record: { id: string };
    if (data.kind === "song") {
      const artist = await tx.artist.upsert({ where: { slug: slugify(data.artist) }, create: { slug: slugify(data.artist), name: data.artist, published: false }, update: {} });
      record = await tx.track.create({ data: { title: data.title, artistId: artist.id, links, durationSec: duration(data.duration), published: false, submittedById: user.id } });
    } else {
      const speaker = await tx.speaker.upsert({ where: { slug: slugify(data.speaker) }, create: { slug: slugify(data.speaker), name: data.speaker }, update: {} });
      record = await tx.sermon.create({ data: { slug: `${slugify(data.title)}-${randomUUID()}`, title: data.title, description: data.description || null, speakerId: speaker.id, locale: data.locale, category: data.category || null, date: data.date ? new Date(data.date) : null, links, durationSec: duration(data.duration), published: false, submittedById: user.id } });
    }
    await tx.auditLog.create({ data: { actorId: user.id, action: "media.submit", entityType: data.kind === "song" ? "track" : "sermon", entityId: record.id, metadata: { rightsDeclared: true, provider: data.provider, sourceUrl: data.url, locale: data.locale } } });
    return record;
  });
  return NextResponse.json({ id: created.id, kind: data.kind, status: "pending_review" }, { status: 201 });
});
