import { prisma } from "@cp/db";
import { adminPlanSchema } from "@cp/shared";
import { body, clientIp, handler } from "@/lib/api";
import { uniqueOr409 } from "@/lib/admin";
import { audit } from "@/lib/audit";

export const POST = handler({ roles: ["EDITOR"], limit: [30, 60] }, async ({ req, user }) => {
  const data = await body(req, adminPlanSchema);
  const plan = await uniqueOr409(() =>
    prisma.readingPlan.create({ data: { ...data, dayCount: data.days.length, days: data.days as unknown as object } }),
  );
  await audit({ actorId: user?.id, action: "plan.create", entityType: "reading_plan", entityId: plan.id, metadata: { slug: plan.slug }, ip: clientIp(req) });
  return { id: plan.id, slug: plan.slug };
});
