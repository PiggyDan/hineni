import { Search } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BIBLE_BOOKS, bookName, editionBooks } from "@cp/shared";
import { prisma } from "@cp/db";
import { ReferenceSearch } from "@/components/bible/reference-search";
import { Link } from "@/i18n/navigation";
import { readerContext } from "@/lib/reader";
import { BookChapterPicker } from "@/components/bible/book-chapter-picker";
import { MongolianBibleLink } from "@/components/bible/mongolian-bible-link";
import { TranslationUnavailable } from "@/components/bible/translation-unavailable";
import { TranslationSelect } from "@/components/bible/translation-select";
import { ContinueReading } from "@/components/home/continue-reading";
import { listTranslations } from "@/lib/bible";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: (await getTranslations({ locale, namespace: "bible" }))("title") };
}

export default async function BibleIndex({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { t: requested } = await searchParams;
  const t = await getTranslations("bible");
  const tr = await getTranslations("app.reader");
  const { user, translation, fallback, requestedId } = await readerContext(locale, requested);

  const header = (subtitle?: string) => (
    <header className="animate-rise">
      <p className="eyebrow">{tr("books")}</p>
      <h1 className="page-title mt-2">{t("title")}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </header>
  );

  if (!translation)
    return (
      <div className="page">
        {header()}
        <TranslationUnavailable locale={locale} requestedId={requestedId} signedIn={!!user} />
        <div className="card p-4 sm:p-6">
          <BookChapterPicker books={editionBooks(undefined, locale)} inline />
        </div>
      </div>
    );

  const history = user
    ? await prisma.readingHistory.findMany({ where: { userId: user.id, translationId: translation.id }, orderBy: { readAt: "desc" }, take: 8 }).catch(() => [])
    : [];
  const qs = `?t=${translation.id}`;
  const last = history[0];
  const bookNames = Object.fromEntries(BIBLE_BOOKS.map((book) => [book.id, bookName(book.id, locale)]));

  return (
    <div className="page">
      {header(`${translation.name} · ${translation.abbreviation}`)}

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <div className="grid content-start gap-5">
          <ContinueReading bookNames={bookNames} last={last ? { bookId: last.bookId, chapter: last.chapter, translationId: last.translationId, at: last.readAt.toISOString() } : null} />
          <div className="card space-y-4 p-6">
            <TranslationSelect signedIn={!!user} value={translation.id} options={await listTranslations()} />
            <ReferenceSearch translationId={translation.id} metadata={translation.metadata} />
            <Link href={`/bible/search${qs}`} className="inline-flex items-center gap-2 text-sm font-medium text-accent-ink hover:underline">
              <Search className="size-4" aria-hidden />
              {tr("search")}
            </Link>
            {fallback && (
              <div>
                <p className="text-sm text-ink-muted">{t("noMongolian")}</p>
                <MongolianBibleLink locale={locale} />
              </div>
            )}
          </div>
          {history.length > 1 && (
            <section aria-labelledby="history-heading" className="card p-6">
              <h2 id="history-heading" className="eyebrow mb-4">
                {t("history")}
              </h2>
              <ul className="flex flex-wrap gap-2">
                {history.map((h) => (
                  <li key={h.id}>
                    <Link href={`/bible/${h.bookId.toLowerCase()}/${h.chapter}${qs}`} className="chip">
                      {bookName(h.bookId, locale)} {h.chapter}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <section className="card p-4 sm:p-6" aria-label={t("chooseBook")}>
          <BookChapterPicker books={editionBooks(translation.metadata, locale)} translationId={translation.id} inline />
        </section>
      </div>
    </div>
  );
}
