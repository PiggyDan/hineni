import { prisma } from "@cp/db";
import { moderationDecisionSchema } from "@cp/shared";
import { ApiError, body, clientIp, handler } from "@/lib/api";
import { audit } from "@/lib/audit";

/** APPROVED = report upheld and resolved; REJECTED = dismissed. */
export const PATCH = handler<{ id: string }>({ roles: ["MODERATOR"], limit: [60, 60] }, async ({ req, params, user }) => {
  const data = await body(req, moderationDecisionSchema);
  if (!(await prisma.report.findUnique({ where: { id: params.id }, select: { id: true } }))) throw new ApiError(404, "not_found");
  const report = await prisma.report.update({ where: { id: params.id }, data: { status: data.status, resolvedById: user?.id }, select: { id: true, status: true } });
  await audit({ actorId: user?.id, action: `report.${data.status.toLowerCase()}`, entityType: "report", entityId: report.id, ip: clientIp(req) });
  return report;
});
