import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@cp/db";
import { PlanEditor } from "@/components/admin/plan-editor";
import { staffUser } from "@/lib/admin";
import { planDays } from "@/lib/progress";

export default async function AdminPlans({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("app.admin");
  const { allowed } = await staffUser(["EDITOR"]);
  if (!allowed) return <p role="alert" className="text-ink-muted">{t("forbidden")}</p>;
  const plans = await prisma.readingPlan.findMany({ orderBy: [{ published: "desc" }, { dayCount: "asc" }], include: { _count: { select: { enrollments: true } } } });

  return (
    <div>
      <h1 className="page-title mb-6">{t("plans")}</h1>
      <PlanEditor
        plans={plans.map((plan) => ({
          id: plan.id,
          slug: plan.slug,
          kind: plan.kind,
          titleEn: plan.titleEn,
          titleMn: plan.titleMn,
          descriptionEn: plan.descriptionEn,
          descriptionMn: plan.descriptionMn,
          days: planDays(plan),
          published: plan.published,
          enrollments: plan._count.enrollments,
        }))}
      />
    </div>
  );
}
