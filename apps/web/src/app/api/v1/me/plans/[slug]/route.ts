import { prisma } from "@cp/db";
import { planProgressSchema } from "@cp/shared";
import { ApiError, body, handler } from "@/lib/api";

const serialize = (enrollment: { id: string; completedDays: number[]; startedAt: Date; completedAt: Date | null }) => ({
  id: enrollment.id,
  completedDays: [...enrollment.completedDays].sort((a, b) => a - b),
  startedAt: enrollment.startedAt.toISOString(),
  completedAt: enrollment.completedAt?.toISOString() ?? null,
});

async function publishedPlan(slug: string) {
  const plan = await prisma.readingPlan.findFirst({ where: { slug, published: true }, select: { id: true, dayCount: true } });
  if (!plan) throw new ApiError(404, "not_found");
  return plan;
}

/** Start (or resume) a plan. Idempotent. */
export const POST = handler<{ slug: string }>({ auth: true }, async ({ params, user }) => {
  if (!user) throw new ApiError(401, "unauthorized");
  const plan = await publishedPlan(params.slug);
  const enrollment = await prisma.planEnrollment.upsert({
    where: { userId_planId: { userId: user.id, planId: plan.id } },
    update: {},
    create: { userId: user.id, planId: plan.id },
  });
  return serialize(enrollment);
});

/** Mark one day as read or unread. */
export const PATCH = handler<{ slug: string }>({ auth: true }, async ({ req, params, user }) => {
  if (!user) throw new ApiError(401, "unauthorized");
  const plan = await publishedPlan(params.slug);
  const data = await body(req, planProgressSchema);
  if (data.day > plan.dayCount) throw new ApiError(400, "day_out_of_range");
  const enrollment = await prisma.planEnrollment.findUnique({ where: { userId_planId: { userId: user.id, planId: plan.id } } });
  if (!enrollment) throw new ApiError(404, "not_enrolled");

  const days = new Set(enrollment.completedDays);
  if (data.completed) days.add(data.day);
  else days.delete(data.day);
  const completedDays = [...days].sort((a, b) => a - b);
  const updated = await prisma.planEnrollment.update({
    where: { id: enrollment.id },
    data: { completedDays, completedAt: completedDays.length >= plan.dayCount ? (enrollment.completedAt ?? new Date()) : null },
  });
  return serialize(updated);
});

/** Leave a plan; removes only this reader's progress for it. */
export const DELETE = handler<{ slug: string }>({ auth: true }, async ({ params, user }) => {
  if (!user) throw new ApiError(401, "unauthorized");
  const plan = await publishedPlan(params.slug);
  await prisma.planEnrollment.deleteMany({ where: { userId: user.id, planId: plan.id } });
  return { ok: true };
});
