import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@cp/db";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress";
import { Link } from "@/i18n/navigation";
import { planProgress } from "@/lib/progress";
import { getCurrentUser } from "@/lib/session";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: (await getTranslations({ locale, namespace: "app.plans" }))("title") };
}

export default async function PlansPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("app.plans");
  const user = await getCurrentUser();
  const [plans, enrollments] = await Promise.all([
    prisma.readingPlan.findMany({ where: { published: true }, orderBy: [{ kind: "asc" }, { dayCount: "asc" }] }).catch(() => []),
    user ? prisma.planEnrollment.findMany({ where: { userId: user.id }, orderBy: { startedAt: "desc" } }).catch(() => []) : [],
  ]);
  const byPlan = new Map(enrollments.map((enrollment) => [enrollment.planId, enrollment]));
  const title = (plan: { titleEn: string; titleMn: string }) => (locale === "mn" ? plan.titleMn : plan.titleEn);
  const mine = plans.filter((plan) => byPlan.has(plan.id));
  const groups = [
    { key: "thematic", items: plans.filter((plan) => plan.kind === "THEMATIC") },
    { key: "canonical", items: plans.filter((plan) => plan.kind === "CANONICAL") },
  ] as const;

  return (
    <>
      <PageHeader eyebrow={t("allPlans")} title={t("title")} subtitle={t("subtitle")} />
      <div className="container-page space-y-12 pt-8">
        {!plans.length && <EmptyState>{t("empty")}</EmptyState>}

        {mine.length > 0 && (
          <section aria-labelledby="mine-heading">
            <h2 id="mine-heading" className="mb-4 font-display text-2xl font-semibold text-ink">{t("myPlans")}</h2>
            <ul className="grid gap-4 md:grid-cols-2">
              {mine.map((plan) => {
                const enrollment = byPlan.get(plan.id)!;
                const progress = planProgress(plan.dayCount, enrollment.completedDays);
                return (
                  <li key={plan.id}>
                    <Link href={`/plans/${plan.slug}`} className="card group flex h-full flex-col gap-3 p-6 transition hover:border-accent">
                      <span className="flex items-start justify-between gap-3">
                        <span className="font-display text-xl font-semibold text-ink">{title(plan)}</span>
                        <ArrowRight className="mt-1 size-4 shrink-0 text-ink-muted transition group-hover:translate-x-0.5 rtl:rotate-180" aria-hidden />
                      </span>
                      <span className="text-sm text-ink-muted">
                        {progress.nextDay ? t("dayOf", { day: progress.nextDay, total: plan.dayCount }) : t("completed")} · {t("percent", { percent: progress.percent })}
                      </span>
                      <ProgressBar value={progress.percent} label={title(plan)} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {groups.map(({ key, items }) =>
          items.length ? (
            <section key={key} aria-labelledby={`${key}-heading`}>
              <h2 id={`${key}-heading`} className="mb-4 font-display text-2xl font-semibold text-ink">{t(key)}</h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((plan) => (
                  <li key={plan.id}>
                    <Link href={`/plans/${plan.slug}`} className="card group flex h-full flex-col gap-3 p-6 transition hover:-translate-y-0.5 hover:border-accent">
                      <span className="text-xs font-semibold tracking-wider text-secondary uppercase">{t("length", { count: plan.dayCount })}</span>
                      <span className="font-display text-xl font-semibold text-ink">{title(plan)}</span>
                      <span className="line-clamp-3 text-sm leading-relaxed text-ink-muted">{locale === "mn" ? plan.descriptionMn : plan.descriptionEn}</span>
                      {byPlan.has(plan.id) && <span className="mt-auto text-xs font-medium text-accent-ink">{t("percent", { percent: planProgress(plan.dayCount, byPlan.get(plan.id)!.completedDays).percent })}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null,
        )}
      </div>
    </>
  );
}
