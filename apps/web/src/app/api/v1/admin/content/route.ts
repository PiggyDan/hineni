import { prisma } from "@cp/db";
import { adminContentSchema } from "@cp/shared";
import { body, clientIp, handler } from "@/lib/api";
import { uniqueOr409 } from "@/lib/admin";
import { audit } from "@/lib/audit";

export const POST = handler({ roles: ["EDITOR"], limit: [30, 60] }, async ({ req, user }) => {
  const data = await body(req, adminContentSchema);
  const content = await uniqueOr409(() =>
    prisma.content.create({
      data: {
        ...data,
        publishedAt: data.status === "PUBLISHED" ? new Date() : null,
        createdById: user?.id,
        revisions: { create: { editorId: user?.id, title: data.title, body: data.body, status: data.status } },
      },
    }),
  );
  await audit({ actorId: user?.id, action: "content.create", entityType: "content", entityId: content.id, metadata: { type: content.type, status: content.status }, ip: clientIp(req) });
  return { id: content.id };
});
