import { prisma } from "@cp/db";
import { adminPlanUpdateSchema } from "@cp/shared";
import { ApiError, body, clientIp, handler } from "@/lib/api";
import { uniqueOr409 } from "@/lib/admin";
import { audit } from "@/lib/audit";

/** Plans are never deleted here: readers' enrollments reference them. Unpublish instead. */
export const PATCH = handler<{ id: string }>({ roles: ["EDITOR"], limit: [60, 60] }, async ({ req, params, user }) => {
  const data = await body(req, adminPlanUpdateSchema);
  if (!(await prisma.readingPlan.findUnique({ where: { id: params.id }, select: { id: true } }))) throw new ApiError(404, "not_found");
  const { days, ...rest } = data;
  const plan = await uniqueOr409(() =>
    prisma.readingPlan.update({
      where: { id: params.id },
      data: { ...rest, ...(days ? { days: days as unknown as object, dayCount: days.length } : {}) },
    }),
  );
  await audit({ actorId: user?.id, action: "plan.update", entityType: "reading_plan", entityId: plan.id, metadata: { fields: Object.keys(data) }, ip: clientIp(req) });
  return { id: plan.id, slug: plan.slug, published: plan.published };
});
