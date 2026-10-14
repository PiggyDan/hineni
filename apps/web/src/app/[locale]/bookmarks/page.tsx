import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { bookName, formatReference, parsePassageKey, scriptureDirection } from "@cp/shared";
import { prisma } from "@cp/db";
import { BookmarksView } from "@/components/bookmarks/bookmarks-view";
import { PageHeader } from "@/components/ui/page-header";
import { redirect } from "@/i18n/navigation";
import { getPassage, listTranslations } from "@/lib/bible";
import { readingHref } from "@/lib/progress";
import { getCurrentUser } from "@/lib/session";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: (await getTranslations({ locale, namespace: "app.bookmarks" }))("title"), robots: { index: false, follow: false } };
}

const PREVIEW_LIMIT = 30;

export default async function BookmarksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: "/sign-in", locale });
    return null;
  }
  const t = await getTranslations("app.bookmarks");
  const [bookmarks, highlights, history, translations] = await Promise.all([
    prisma.bookmark.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.highlight.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 200 }),
    prisma.readingHistory.findMany({ where: { userId: user.id }, orderBy: { readAt: "desc" }, take: 60 }),
    listTranslations().catch(() => []),
  ]);
  const editions = new Map(translations.map((item) => [item.id, item]));

  // Verse text comes from the same licensed provider as the reader; failures simply omit the preview.
  const savedBookmarks = await Promise.all(
    bookmarks.map(async (bookmark, index) => {
      const passage = parsePassageKey(bookmark.passageKey) ?? { bookId: bookmark.bookId, chapter: bookmark.chapter };
      const edition = editions.get(bookmark.translationId);
      const text =
        edition && index < PREVIEW_LIMIT && passage.verseStart
          ? await getPassage(edition, passage).then((result) => result.verses.map((v) => v.text).join(" "), () => null)
          : null;
      return {
        id: bookmark.id,
        label: formatReference(passage, locale),
        href: readingHref(passage, bookmark.translationId),
        translation: edition?.abbreviation ?? bookmark.translationId,
        text,
        lang: edition?.language,
        dir: edition ? scriptureDirection(edition.language) : undefined,
      };
    }),
  );

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="container-page pt-8">
        <BookmarksView
          bookmarks={savedBookmarks}
          highlights={highlights.map((h) => ({
            id: h.id,
            label: formatReference({ bookId: h.bookId, chapter: h.chapter, verseStart: h.verse }, locale),
            href: readingHref({ bookId: h.bookId, chapter: h.chapter, verseStart: h.verse }, h.translationId),
            color: h.color,
            translation: editions.get(h.translationId)?.abbreviation ?? h.translationId,
            remove: { bookId: h.bookId, chapter: h.chapter, verse: h.verse, translationId: h.translationId },
          }))}
          history={history.map((item) => ({
            id: item.id,
            label: `${bookName(item.bookId, locale)} ${item.chapter}`,
            href: readingHref({ bookId: item.bookId, chapter: item.chapter }, item.translationId),
            meta: `${editions.get(item.translationId)?.abbreviation ?? item.translationId} · ${item.readAt.toLocaleDateString(locale, { month: "short", day: "numeric" })}`,
          }))}
        />
      </div>
    </>
  );
}
