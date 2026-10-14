import { prisma } from "@cp/db";
import { adminRoleSchema } from "@cp/shared";
import { ApiError, body, clientIp, handler } from "@/lib/api";
import { audit } from "@/lib/audit";

export const PATCH = handler<{ id: string }>({ roles: ["ADMIN"], limit: [30, 60] }, async ({ req, params, user }) => {
  const data = await body(req, adminRoleSchema);
  // Prevents an administrator from locking everyone out by demoting themselves.
  if (params.id === user?.id) throw new ApiError(400, "cannot_change_self");
  const target = await prisma.user.findUnique({ where: { id: params.id }, select: { role: true } });
  if (!target) throw new ApiError(404, "not_found");
  const updated = await prisma.user.update({ where: { id: params.id }, data: { role: data.role }, select: { id: true, role: true } });
  await audit({ actorId: user?.id, action: "user.role.change", entityType: "user", entityId: params.id, metadata: { from: target.role, to: data.role }, ip: clientIp(req) });
  return updated;
});
