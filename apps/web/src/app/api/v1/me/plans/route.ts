import { prisma } from "@cp/db";
import { ApiError, handler } from "@/lib/api";

/** The reader's plan enrollments with progress (also used by future mobile clients). */
export const GET = handler({ auth: true }, async ({ user }) => {
  if (!user) throw new ApiError(401, "unauthorized");
  const rows = await prisma.planEnrollment.findMany({
    where: { userId: user.id },
    orderBy: { startedAt: "desc" },
    include: { plan: { select: { slug: true, titleEn: true, titleMn: true, dayCount: true } } },
  });
  return rows.map((row) => ({
    slug: row.plan.slug,
    titleEn: row.plan.titleEn,
    titleMn: row.plan.titleMn,
    dayCount: row.plan.dayCount,
    completedDays: row.completedDays,
    startedAt: row.startedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
  }));
});
