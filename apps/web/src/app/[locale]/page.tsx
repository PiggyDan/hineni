import { ArrowRight, Feather, HandHeart, ListChecks, Plus } from "lucide-react";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BIBLE_BOOKS, bookName, brandTagline, branding } from "@cp/shared";
import { prisma } from "@cp/db";
import { BrandLogo } from "@/components/branding/brand-logo";
import { ContinueReading } from "@/components/home/continue-reading";
import { Greeting } from "@/components/home/greeting";
import { VerseOfDay } from "@/components/home/verse-of-day";
import { buttonClass } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { contentHref } from "@/lib/content";
import { chaptersReadCount, planProgress, TOTAL_CHAPTERS } from "@/lib/progress";
import { readerContext } from "@/lib/reader";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // Root-level files such as /favicon.ico can reach this segment; reject them before using Intl APIs.
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("app");
  const { user, translation, requestedId } = await readerContext(locale);
  const now = new Date();

  const [plans, devotional, personal] = await Promise.all([
    prisma.readingPlan.findMany({ where: { published: true }, orderBy: { dayCount: "asc" }, take: 3 }).catch(() => []),
    prisma.content
      .findFirst({
        where: { type: "DEVOTIONAL", status: "PUBLISHED", locale, OR: [{ publishDate: null }, { publishDate: { lte: now } }] },
        orderBy: [{ publishDate: "desc" }, { publishedAt: "desc" }],
        select: { type: true, slug: true, title: true, summary: true, scriptureRefs: true, author: true },
      })
      .catch(() => null),
    user
      ? Promise.all([
          prisma.readingHistory.findFirst({ where: { userId: user.id }, orderBy: { readAt: "desc" } }),
          chaptersReadCount(user.id),
          prisma.planEnrollment.findMany({
            where: { userId: user.id, completedAt: null },
            include: { plan: { select: { slug: true, titleEn: true, titleMn: true, dayCount: true } } },
            orderBy: { startedAt: "desc" },
            take: 2,
          }),
          prisma.prayer.groupBy({ by: ["answered"], where: { userId: user.id }, _count: true }),
        ]).catch(() => null)
      : null,
  ]);

  const [lastRead, chaptersRead, enrollments, prayerGroups] = personal ?? [null, 0, [], []];
  const prayerCount = (answered: boolean) => prayerGroups.find((g) => g.answered === answered)?._count ?? 0;
  const bookNames = Object.fromEntries(BIBLE_BOOKS.map((book) => [book.id, bookName(book.id, locale)]));
  const dateLabel = now.toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric" });
  const planTitle = (plan: { titleEn: string; titleMn: string }) => (locale === "mn" ? plan.titleMn : plan.titleEn);

  return (
    <div className="page">
      <header className="animate-rise">
        <p className="text-sm text-ink-muted">{dateLabel}</p>
        <div className="mt-2">
          <Greeting name={user?.name} />
        </div>
        <p className="mt-2 text-lg text-ink-muted">{t("home.invitation")}</p>
      </header>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1.45fr_1fr]" aria-label={t("home.verseOfDay")}>
        <VerseOfDay locale={locale} translationId={translation?.id ?? requestedId} userId={user?.id} />
        <div className="grid gap-5">
          <ContinueReading
            bookNames={bookNames}
            last={lastRead ? { bookId: lastRead.bookId, chapter: lastRead.chapter, translationId: lastRead.translationId, at: lastRead.readAt.toISOString() } : null}
          />
          {user ? (
            <div className="card flex flex-col gap-4 p-6">
              <span className="flex items-center justify-between">
                <span className="eyebrow">{t("home.prayerSpace")}</span>
                <span className="flex size-9 items-center justify-center rounded-full bg-muted text-accent-ink">
                  <HandHeart className="size-4" aria-hidden />
                </span>
              </span>
              <p className="text-sm text-ink-muted">{t("home.prayerPrompt")}</p>
              <p className="flex gap-4 text-sm">
                <span className="text-ink">{t("home.openPrayers", { count: prayerCount(false) })}</span>
                <span className="text-secondary">{t("home.answeredPrayers", { count: prayerCount(true) })}</span>
              </p>
              <div className="mt-auto flex gap-2">
                <Link href="/prayer?new=1" className={buttonClass("primary", "sm")}>
                  <Plus className="size-4" aria-hidden />
                  {t("home.newPrayer")}
                </Link>
                <Link href="/prayer" className={buttonClass("ghost", "sm")}>
                  {t("nav.prayer")}
                </Link>
              </div>
            </div>
          ) : (
            <div className="card flex flex-col gap-4 p-6">
              <BrandLogo variant="symbol" decorative className="w-10" />
              <p className="font-display text-xl font-semibold text-ink">{t("home.signedOutTitle")}</p>
              <p className="text-sm leading-relaxed text-ink-muted">{t("home.signedOutBody")}</p>
              <div className="mt-auto flex flex-wrap gap-2">
                <Link href="/sign-up" className={buttonClass("primary", "sm")}>
                  {t("common.createAccountCta")}
                </Link>
                <Link href="/sign-in" className={buttonClass("ghost", "sm")}>
                  {t("common.signInCta")}
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mt-5 grid gap-5 md:grid-cols-2">
        <article className="card flex flex-col gap-4 p-6">
          <span className="flex items-center justify-between">
            <span className="eyebrow">{t("home.devotional")}</span>
            <Feather className="size-4 text-accent-ink" aria-hidden />
          </span>
          {devotional ? (
            <>
              <h2 className="font-display text-2xl font-semibold text-ink">{devotional.title}</h2>
              {devotional.summary && <p className="line-clamp-3 text-sm leading-relaxed text-ink-muted">{devotional.summary}</p>}
              {devotional.scriptureRefs.length > 0 && <p className="text-xs text-secondary">{devotional.scriptureRefs.join(" · ")}</p>}
              <Link href={contentHref(devotional)} className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-accent-ink">
                {t("home.readDevotional")}
                <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-ink-muted">{t("home.devotionalEmpty")}</p>
              <Link href="/plans" className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-accent-ink">
                {t("home.browsePlans")}
                <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
              </Link>
            </>
          )}
        </article>

        <article className="card flex flex-col gap-4 p-6">
          <span className="flex items-center justify-between">
            <span className="eyebrow">{t("home.progress")}</span>
            <ListChecks className="size-4 text-accent-ink" aria-hidden />
          </span>
          {user ? (
            <>
              <div>
                <p className="text-sm text-ink">{t("home.chaptersRead", { count: chaptersRead, total: TOTAL_CHAPTERS })}</p>
                <ProgressBar className="mt-2" value={chaptersRead} max={TOTAL_CHAPTERS} label={t("home.progress")} />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold tracking-wider text-ink-muted uppercase">{t("home.activePlans")}</p>
                {enrollments.length ? (
                  <ul className="space-y-3">
                    {enrollments.map((enrollment) => {
                      const progress = planProgress(enrollment.plan.dayCount, enrollment.completedDays);
                      return (
                        <li key={enrollment.id}>
                          <Link href={`/plans/${enrollment.plan.slug}`} className="block rounded-xl p-2 -m-2 hover:bg-muted">
                            <span className="flex justify-between gap-3 text-sm">
                              <span className="truncate font-medium text-ink">{planTitle(enrollment.plan)}</span>
                              <span className="shrink-0 text-ink-muted">{t("plans.percent", { percent: progress.percent })}</span>
                            </span>
                            <ProgressBar className="mt-2" value={progress.percent} label={planTitle(enrollment.plan)} />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-ink-muted">{t("home.noActivePlans")}</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm leading-relaxed text-ink-muted">{t("plans.signInToTrack")}</p>
          )}
        </article>
      </section>

      {plans.length > 0 && (
        <section className="mt-12" aria-labelledby="plans-heading">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 id="plans-heading" className="font-display text-2xl font-semibold text-ink">
              {t("home.featuredPlans")}
            </h2>
            <Link href="/plans" className="text-sm font-medium text-accent-ink hover:underline">
              {t("home.seeAll")}
            </Link>
          </div>
          <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
            {plans.map((plan) => (
              <li key={plan.id} className="w-[78%] shrink-0 snap-start sm:w-auto">
                <Link href={`/plans/${plan.slug}`} className="card group flex h-full flex-col gap-3 p-6 transition hover:-translate-y-0.5 hover:border-accent">
                  <span className="text-xs font-semibold tracking-wider text-secondary uppercase">{t("plans.length", { count: plan.dayCount })}</span>
                  <span className="font-display text-xl font-semibold text-ink">{planTitle(plan)}</span>
                  <span className="line-clamp-3 text-sm leading-relaxed text-ink-muted">{locale === "mn" ? plan.descriptionMn : plan.descriptionEn}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-14 text-center text-sm text-ink-muted">
        <span lang="he" dir="rtl" className="font-reading text-base text-accent-ink">{branding.hebrewName}</span>
        <span className="mx-2" aria-hidden>·</span>
        {brandTagline(locale)}
      </p>
    </div>
  );
}
