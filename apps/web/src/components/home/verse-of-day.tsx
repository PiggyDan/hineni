import { getTranslations } from "next-intl/server";
import { dailyVerseReference, formatReference, passageKey, scriptureDirection, type Passage } from "@cp/shared";
import { prisma } from "@cp/db";
import { MongolianBibleLink } from "@/components/bible/mongolian-bible-link";
import { Link } from "@/i18n/navigation";
import { getPassage, resolveTranslation } from "@/lib/bible";
import { readingHref } from "@/lib/progress";
import { VerseActions } from "./verse-actions";

/**
 * The day's verse from the reader's chosen edition. Text always comes from the configured
 * licensed/public-domain provider; when none is available the card says so instead of substituting.
 */
export async function VerseOfDay({
  locale,
  translationId,
  userId,
  passage = dailyVerseReference(),
  size = "lg",
}: {
  locale: string;
  translationId?: string | null;
  userId?: string;
  passage?: Passage;
  size?: "lg" | "xl";
}) {
  const t = await getTranslations("app.home");
  const tb = await getTranslations("bible");
  const { translation } = await resolveTranslation(translationId, locale);
  const text = translation ? await getPassage(translation, passage).catch(() => null) : null;
  const reference = formatReference(passage, locale);
  const saved =
    translation && userId
      ? !!(await prisma.bookmark
          .findUnique({ where: { userId_passageKey_translationId: { userId, passageKey: passageKey(passage), translationId: translation.id } } })
          .catch(() => null))
      : false;
  const verseText = text?.verses.map((v) => v.text).join(" ");

  return (
    <figure className="relative isolate flex h-full flex-col overflow-hidden rounded-[24px] bg-[#101827] p-7 text-[#EEEAE2] shadow-xl shadow-[#101827]/10 ring-1 ring-white/5 sm:p-10">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_100%_0%,rgba(197,164,109,0.22),transparent_55%),radial-gradient(90%_60%_at_0%_100%,rgba(130,150,136,0.16),transparent_60%)]"
      />
      <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-[#C5A46D] uppercase">{t("verseOfDay")}</p>
      {translation && text && verseText ? (
        <>
          <blockquote
            lang={translation.language}
            dir={scriptureDirection(translation.language)}
            className={`scripture mt-6 text-[#F5F1E8] ${size === "xl" ? "[--reader-size:1.65rem] sm:[--reader-size:2.1rem]" : "[--reader-size:1.4rem] sm:[--reader-size:1.75rem]"} [--reader-leading:1.55]`}
          >
            {verseText}
          </blockquote>
          <figcaption className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-display text-lg font-semibold text-[#E9D6AE]">{reference}</span>
            <span className="text-xs tracking-wider text-[#A3A9B5] uppercase">{translation.abbreviation}</span>
          </figcaption>
          <VerseActions
            passage={passage}
            translationId={translation.id}
            shareText={`“${verseText}” — ${reference} (${translation.abbreviation})`}
            chapterHref={readingHref(passage, translation.id)}
            signedIn={!!userId}
            initiallySaved={saved}
          />
          <p className="mt-6 text-[0.7rem] leading-relaxed text-[#A3A9B5]/80">{text.copyright}</p>
        </>
      ) : (
        <div className="mt-6 space-y-4">
          <p className="font-display text-2xl font-semibold text-[#F5F1E8]">{reference}</p>
          <p role="status" className="max-w-md text-sm leading-relaxed text-[#A3A9B5]">
            {translation ? tb("unavailable") : tb("translationUnavailable")}
          </p>
          <div className="flex flex-wrap gap-2 [&_a]:border-white/15 [&_a]:text-[#E9D6AE]">
            <Link href="/settings" className="inline-flex min-h-11 items-center rounded-xl border px-4 text-sm">
              {tb("chooseTranslation")}
            </Link>
            <MongolianBibleLink locale={locale} />
          </div>
        </div>
      )}
    </figure>
  );
}
