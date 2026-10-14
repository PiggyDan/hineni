import { prisma } from "@cp/db";
import { adminContentUpdateSchema } from "@cp/shared";
import { ApiError, body, clientIp, handler } from "@/lib/api";
import { uniqueOr409 } from "@/lib/admin";
import { audit } from "@/lib/audit";

/** Every save records a revision, so edits stay reviewable. */
export const PATCH = handler<{ id: string }>({ roles: ["EDITOR"], limit: [60, 60] }, async ({ req, params, user }) => {
  const data = await body(req, adminContentUpdateSchema);
  const existing = await prisma.content.findUnique({ where: { id: params.id } });
  if (!existing) throw new ApiError(404, "not_found");
  const status = data.status ?? existing.status;
  const content = await uniqueOr409(() =>
    prisma.content.update({
      where: { id: params.id },
      data: {
        ...data,
        publishedAt: status === "PUBLISHED" ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
        revisions: { create: { editorId: user?.id, title: data.title ?? existing.title, body: data.body ?? existing.body, status } },
      },
    }),
  );
  await audit({ actorId: user?.id, action: "content.update", entityType: "content", entityId: content.id, metadata: { status: content.status }, ip: clientIp(req) });
  return { id: content.id, status: content.status };
});
