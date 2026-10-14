import { ArrowRight, Feather, ListChecks } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { formatReference } from "@cp/shared";
import { prisma } from "@cp/db";
import { VerseOfDay } from "@/components/home/verse-of-day";
import { Link } from "@/i18n/navigation";
import { contentHref } from "@/lib/content";
import { planDays, planProgress, readingHref } from "@/lib/progress";
import { readerContext } from "@/lib/reader";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: (await getTranslations({ locale, namespace: "app.daily" }))("title") };
}

export default async function DailyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("app");
  const { user, translation, requestedId } = await readerContext(locale);
  const now = new Date();
  const [devotional, enrollments] = await Promise.all([
    prisma.content
      .findFirst({
        where: { type: "DEVOTIONAL", status: "PUBLISHED", locale, OR: [{ publishDate: null }, { publishDate: { lte: now } }] },
        orderBy: [{ publishDate: "desc" }, { publishedAt: "desc" }],
        select: { type: true, slug: true, title: true, summary: true },
      })
      .catch(() => null),
    user
      ? prisma.planEnrollment
          .findMany({ where: { userId: user.id, completedAt: null }, include: { plan: true }, orderBy: { startedAt: "desc" }, take: 3 })
          .catch(() => [])
      : [],
  ]);

  const nextReadings = enrollments.flatMap((enrollment) => {
    const { nextDay } = planProgress(enrollment.plan.dayCount, enrollment.completedDays);
    const passages = nextDay ? planDays(enrollment.plan)[nextDay - 1] : undefined;
    return passages?.length
      ? [{ slug: enrollment.plan.slug, title: locale === "mn" ? enrollment.plan.titleMn : enrollment.plan.titleEn, day: nextDay!, passages }]
      : [];
  });

  return (
    <div className="page-narrow">
      <header className="animate-rise">
        <p className="text-sm text-ink-muted">{now.toLocaleDateString(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        <h1 className="page-title mt-2">{t("daily.title")}</h1>
        <p className="page-subtitle">{t("daily.subtitle")}</p>
      </header>

      <div className="mt-8">
        <VerseOfDay locale={locale} translationId={translation?.id ?? requestedId} userId={user?.id} size="xl" />
        <p className="mt-3 text-xs text-ink-muted">{t("daily.rotation")}</p>
      </div>

      <section className="mt-12" aria-labelledby="today-heading">
        <h2 id="today-heading" className="mb-4 font-display text-2xl font-semibold text-ink">{t("daily.alsoToday")}</h2>
        <div className="grid gap-4">
          {devotional ? (
            <Link href={contentHref(devotional)} className="card group flex items-start gap-4 p-5 transition hover:border-accent">
              <Feather className="mt-1 size-5 shrink-0 text-accent-ink" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="eyebrow">{t("home.devotional")}</span>
                <span className="mt-1 block font-display text-lg font-semibold text-ink">{devotional.title}</span>
                {devotional.summary && <span className="mt-1 line-clamp-2 block text-sm text-ink-muted">{devotional.summary}</span>}
              </span>
              <ArrowRight className="mt-1 size-4 text-ink-muted rtl:rotate-180" aria-hidden />
            </Link>
          ) : (
            <p className="card-soft p-5 text-sm text-ink-muted">{t("home.devotionalEmpty")}</p>
          )}
          {nextReadings.map((reading) => (
            <div key={reading.slug} className="card flex items-start gap-4 p-5">
              <ListChecks className="mt-1 size-5 shrink-0 text-accent-ink" aria-hidden />
              <div className="min-w-0 flex-1">
                <Link href={`/plans/${reading.slug}`} className="eyebrow hover:underline">
                  {reading.title} · {t("plans.day", { day: reading.day })}
                </Link>
                <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  {reading.passages.map((passage) => (
                    <Link key={formatReference(passage)} href={readingHref(passage, translation?.id)} className="font-medium text-ink hover:text-accent-ink">
                      {formatReference(passage, locale)}
                    </Link>
                  ))}
                </p>
              </div>
            </div>
          ))}
          {!nextReadings.length && (
            <Link href="/plans" className="card group flex items-center gap-4 p-5 transition hover:border-accent">
              <ListChecks className="size-5 shrink-0 text-accent-ink" aria-hidden />
              <span className="flex-1 font-medium text-ink">{t("home.browsePlans")}</span>
              <ArrowRight className="size-4 text-ink-muted rtl:rotate-180" aria-hidden />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
