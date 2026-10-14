import { prisma } from "@cp/db";
import { moderationDecisionSchema } from "@cp/shared";
import { ApiError, body, clientIp, handler } from "@/lib/api";
import { audit } from "@/lib/audit";

export const PATCH = handler<{ id: string }>({ roles: ["MODERATOR"], limit: [60, 60] }, async ({ req, params, user }) => {
  const data = await body(req, moderationDecisionSchema);
  if (!(await prisma.church.findUnique({ where: { id: params.id }, select: { id: true } }))) throw new ApiError(404, "not_found");
  const church = await prisma.church.update({
    where: { id: params.id },
    data: { status: data.status, reviewNote: data.note ?? null, reviewedById: user?.id, reviewedAt: new Date() },
    select: { id: true, status: true },
  });
  await audit({ actorId: user?.id, action: `church.${data.status.toLowerCase()}`, entityType: "church", entityId: church.id, ip: clientIp(req) });
  return church;
});
