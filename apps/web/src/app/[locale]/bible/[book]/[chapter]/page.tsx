import { ChevronLeft, ChevronRight, Columns2, Search } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { bookName, getBook, editionBooks, editionAdjacent } from "@cp/shared";
import { ChapterReader } from "@/components/bible/chapter-reader";
import { CrossReferences } from "@/components/bible/cross-references";
import { BookChapterPicker } from "@/components/bible/book-chapter-picker";
import { TranslationSelect } from "@/components/bible/translation-select";
import { ReaderFrame } from "@/components/bible/reader-frame";
import { ReaderSettingsButton } from "@/components/bible/reader-settings";
import { Link } from "@/i18n/navigation";
import { getChapter, listTranslations } from "@/lib/bible";
import { chapterUserData } from "@/lib/library";
import { readerContext } from "@/lib/reader";
import { MongolianBibleLink } from "@/components/bible/mongolian-bible-link";
import { TranslationUnavailable } from "@/components/bible/translation-unavailable";
import { ParallelReader } from "@/components/bible/parallel-reader";

type Params = Promise<{ locale: string; book: string; chapter: string }>;

function parse(book: string, chapter: string) {
  const b = getBook(book);
  const c = Number(chapter);
  return b && Number.isInteger(c) && c >= 1 && c <= 200 ? { book: b, chapter: c } : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, book, chapter } = await params;
  const p = parse(book, chapter);
  return p ? { title: `${bookName(p.book.id, locale)} ${p.chapter}` } : {};
}

export default async function ChapterPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ t?: string; compare?: string; compareBook?: string; compareChapter?: string }>;
}) {
  const { locale, book, chapter } = await params;
  setRequestLocale(locale);
  const p = parse(book, chapter);
  if (!p) notFound();

  const { t: requested, compare, compareBook, compareChapter } = await searchParams;
  const t = await getTranslations("bible");
  const tr = await getTranslations("app.reader");
  const { user, translation, fallback, fontSize, requestedId } = await readerContext(locale, requested);
  const heading = (
    <h1 className="text-center">
      <span className="block text-xs font-semibold tracking-[0.22em] text-ink-muted uppercase">{bookName(p.book.id, locale)}</span>
      <span className="mt-2 block font-display text-6xl font-semibold text-accent-ink">{p.chapter}</span>
    </h1>
  );
  if (!translation)
    return (
      <div className="page-narrow">
        {heading}
        <TranslationUnavailable locale={locale} requestedId={requestedId} signedIn={!!user} />
      </div>
    );
  const translations = await listTranslations();
  const books = editionBooks(translation.metadata, locale);
  const editionBook = books.find((item) => item.id === p.book.id);
  if (!editionBook)
    return (
      <div className="page-narrow space-y-6">
        {heading}
        <p role="status" className="text-center text-ink-muted">{t("unavailable")}</p>
        <TranslationSelect signedIn={!!user} value={translation.id} options={translations} />
        <div className="card p-4 sm:p-6">
          <BookChapterPicker books={books} bookId={books[0]?.id} translationId={translation.id} inline />
        </div>
      </div>
    );
  if (p.chapter > editionBook.chapters) notFound();
  const [text, userData] = await Promise.all([
    getChapter(translation, p.book.id, p.chapter).catch(() => null),
    user ? chapterUserData(user.id, p.book.id, p.chapter, translation.id) : null,
  ]);

  const query = (extra: Record<string, string | undefined>) => {
    const entries = Object.entries({ t: translation.id, compare, compareBook, compareChapter, ...extra }).filter((e): e is [string, string] => !!e[1]);
    return `?${new URLSearchParams(entries)}`;
  };
  const qs = query({});
  const prev = editionAdjacent(translation.metadata, p.book.id, p.chapter, -1);
  const next = editionAdjacent(translation.metadata, p.book.id, p.chapter, 1);
  const href = (x: { bookId: string; chapter: number }) => `/bible/${x.bookId.toLowerCase()}/${x.chapter}${qs}`;
  const chapterPath = `/bible/${p.book.id.toLowerCase()}/${p.chapter}`;

  // Default comparison: the original language for KJV readers, otherwise KJV.
  const available = new Set(translations.map((item) => item.id));
  const originalId = p.book.testament === "OT" ? "oshb-wlc" : "grc-tisch";
  const defaultCompare = translation.id === "kjv" ? (available.has(originalId) ? originalId : undefined) : available.has("kjv") ? "kjv" : undefined;
  const compareHref = compare
    ? `${chapterPath}${query({ compare: "", compareBook: "", compareChapter: "" })}`
    : defaultCompare
      ? `${chapterPath}${query({ compare: defaultCompare })}`
      : null;

  return (
    <ReaderFrame prevHref={prev ? href(prev) : undefined} nextHref={next ? href(next) : undefined} accountSize={user ? fontSize : undefined}>
      <div data-chrome className="glass sticky top-14 z-30 border-x-0 border-t-0 lg:top-0">
        <div className="mx-auto flex max-w-6xl items-center gap-1.5 px-3 py-2 sm:px-6">
          <BookChapterPicker books={books} bookId={p.book.id} chapter={p.chapter} translationId={translation.id} />
          <div className="ms-auto flex items-center gap-0.5 sm:gap-1">
            <TranslationSelect signedIn={!!user} compact value={translation.id} options={translations} />
            {compareHref && (
              <Link href={compareHref} className="icon-btn aria-current:bg-muted aria-current:text-accent-ink" aria-current={compare ? "true" : undefined} aria-label={compare ? tr("closeCompare") : tr("compare")} title={compare ? tr("closeCompare") : tr("compare")}>
                <Columns2 className="size-4.5" aria-hidden />
              </Link>
            )}
            <Link href={`/bible/search?t=${translation.id}`} aria-label={tr("search")} title={tr("search")} className="icon-btn">
              <Search className="size-4.5" aria-hidden />
            </Link>
            <ReaderSettingsButton signedIn={!!user} />
          </div>
        </div>
      </div>

      <div className={compare ? "mx-auto grid max-w-6xl gap-12 px-5 pt-10 sm:px-8 xl:grid-cols-2" : "mx-auto max-w-176 px-5 pt-10 sm:px-8 sm:pt-14"}>
        <div className="animate-rise">
          <header className="mb-10">
            <p className="mb-5 text-center text-[0.7rem] font-semibold tracking-[0.18em] text-ink-muted uppercase">{translation.name}</p>
            <h1 className="text-center">
              <span className="block text-xs font-semibold tracking-[0.22em] text-ink-muted uppercase">{editionBook.name}</span>
              <span className="mt-2 block font-display text-6xl font-semibold text-accent-ink sm:text-7xl">{p.chapter}</span>
            </h1>
            {fallback && (
              <div className="mt-4 text-center">
                <p className="text-sm text-ink-muted">{t("noMongolian")}</p>
                <MongolianBibleLink locale={locale} />
              </div>
            )}
          </header>

          {text ? (
            <ChapterReader
              key={`${p.book.id}.${p.chapter}.${translation.id}`}
              bookId={p.book.id}
              chapter={p.chapter}
              translationId={translation.id}
              translationAbbr={translation.abbreviation}
              translationLanguage={translation.language}
              readAloudAllowed={translation.copyrightStatus === "public-domain" || translation.license === "CC BY 4.0"}
              verses={text.verses}
              signedIn={!!user}
              accountSize={user ? fontSize : undefined}
              initialHighlights={userData?.highlights ?? {}}
              initialBookmarks={userData?.bookmarks ?? []}
              initialNotes={userData?.notes ?? []}
            />
          ) : (
            <p role="status" className="card-soft p-6 text-center text-ink-muted">{t("unavailable")}</p>
          )}

          {text && <p className="mt-12 text-center text-xs leading-relaxed text-ink-muted" aria-label={tr("copyright")}>{text.copyright}</p>}
        </div>
        {compare && (
          <ParallelReader locale={locale} primaryId={translation.id} bookId={p.book.id} chapter={p.chapter} compare={compare} compareBook={compareBook} compareChapter={compareChapter} />
        )}
      </div>

      <div className="mx-auto max-w-176 px-5 sm:px-8">
        <nav className="mt-14 hidden grid-cols-2 gap-3 sm:grid" aria-label={t("chapters")}>
          {prev ? (
            <Link href={href(prev)} rel="prev" className="card group flex items-center gap-3 p-4 transition hover:border-accent">
              <ChevronLeft className="size-5 text-ink-muted transition group-hover:-translate-x-0.5 rtl:rotate-180" aria-hidden />
              <span className="min-w-0">
                <span className="block text-xs text-ink-muted">{tr("previous")}</span>
                <span className="block truncate font-medium text-ink">{bookName(prev.bookId, locale)} {prev.chapter}</span>
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={href(next)} rel="next" className="card group flex items-center justify-end gap-3 p-4 text-end transition hover:border-accent">
              <span className="min-w-0">
                <span className="block text-xs text-ink-muted">{tr("next")}</span>
                <span className="block truncate font-medium text-ink">{bookName(next.bookId, locale)} {next.chapter}</span>
              </span>
              <ChevronRight className="size-5 text-ink-muted transition group-hover:translate-x-0.5 rtl:rotate-180" aria-hidden />
            </Link>
          )}
        </nav>

        {(!translation.metadata || translation.metadata.versification === "kjv") && <CrossReferences locale={locale} bookId={p.book.id} chapter={p.chapter} qs={qs} />}
      </div>

      {/* Phones: compact chapter arrows above the tab bar (swipe also works). */}
      <nav aria-label={t("chapters")} className="pointer-events-none fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 flex justify-between sm:hidden [html[data-focus]_&]:bottom-4">
        {prev ? (
          <Link href={href(prev)} rel="prev" aria-label={`${tr("previous")}: ${bookName(prev.bookId, locale)} ${prev.chapter}`} className="glass pointer-events-auto flex size-11 items-center justify-center rounded-full text-ink shadow-md">
            <ChevronLeft className="size-5 rtl:rotate-180" aria-hidden />
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={href(next)} rel="next" aria-label={`${tr("next")}: ${bookName(next.bookId, locale)} ${next.chapter}`} className="glass pointer-events-auto flex size-11 items-center justify-center rounded-full text-ink shadow-md">
            <ChevronRight className="size-5 rtl:rotate-180" aria-hidden />
          </Link>
        )}
      </nav>
    </ReaderFrame>
  );
}
