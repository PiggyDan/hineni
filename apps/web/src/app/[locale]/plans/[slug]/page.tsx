import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { formatReference } from "@cp/shared";
import { prisma } from "@cp/db";
import { PlanTracker } from "@/components/plans/plan-tracker";
import { Link } from "@/i18n/navigation";
import { planDays, readingHref } from "@/lib/progress";
import { readerContext } from "@/lib/reader";

type Params = Promise<{ locale: string; slug: string }>;

async function findPlan(slug: string) {
  return prisma.readingPlan.findFirst({ where: { slug, published: true } }).catch(() => null);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const plan = await findPlan(slug);
  return plan ? { title: locale === "mn" ? plan.titleMn : plan.titleEn } : {};
}

export default async function PlanPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("app.plans");
  const plan = await findPlan(slug);
  if (!plan) notFound();

  const { user, translation } = await readerContext(locale);
  const enrollment = user
    ? await prisma.planEnrollment.findUnique({ where: { userId_planId: { userId: user.id, planId: plan.id } } }).catch(() => null)
    : null;
  const days = planDays(plan).map((passages, index) => ({
    day: index + 1,
    readings: passages.map((passage) => ({ label: formatReference(passage, locale), href: readingHref(passage, translation?.id) })),
  }));

  return (
    <div className="page-narrow">
      <header className="animate-rise">
        <Link href="/plans" className="text-sm text-ink-muted hover:text-ink">
          ← {t("title")}
        </Link>
        <p className="eyebrow mt-6">
          {plan.kind === "CANONICAL" ? t("canonical") : t("thematic")} · {t("length", { count: plan.dayCount })}
        </p>
        <h1 className="page-title mt-2">{locale === "mn" ? plan.titleMn : plan.titleEn}</h1>
        <p className="page-subtitle">{locale === "mn" ? plan.descriptionMn : plan.descriptionEn}</p>
      </header>
      <div className="mt-8">
        <PlanTracker slug={plan.slug} days={days} signedIn={!!user} initialCompleted={enrollment ? enrollment.completedDays : null} />
      </div>
    </div>
  );
}
