import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { editionBooks, scriptureDirection, bibleSearchSchema, bookName } from "@cp/shared";
import { PageHeader } from "@/components/ui/page-header";
import { Link } from "@/i18n/navigation";
import { listTranslations, ScriptureUnavailableError } from "@/lib/bible";
import { searchBible } from "@/lib/bible/search";
import { readerContext } from "@/lib/reader";
import { TranslationUnavailable } from "@/components/bible/translation-unavailable";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: (await getTranslations({ locale, namespace: "foundation" }))("bibleSearch"), robots: { index: false, follow: false } };
}
export default async function BibleSearchPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string; t?: string; mode?: string; book?: string; chapter?: string; page?: string }> }) {
  const { locale } = await params; const search = await searchParams; const t = await getTranslations({ locale });
  const { translation, requestedId, user } = await readerContext(locale, search.t);
  if (!translation) return <div className="container-page py-8"><TranslationUnavailable locale={locale} requestedId={requestedId} signedIn={!!user} /></div>;
  const editions = await listTranslations();
  const parsed = bibleSearchSchema.safeParse({ ...search, t: translation.id, book: search.book || undefined, chapter: search.chapter || undefined });
  let results: Awaited<ReturnType<typeof searchBible>> | null = null;
  let error = "";
  if (search.q) {
    if (!parsed.success) error = t("bible.invalidReference");
    else { try { results = await searchBible(parsed.data); } catch (cause) { error = t(cause instanceof ScriptureUnavailableError ? "foundation.importRequired" : "foundation.serviceUnavailable"); } }
  }
  const pageHref = (page: number) => `/bible/search?${new URLSearchParams({ q: search.q || "", t: translation.id, mode: parsed.success ? parsed.data.mode : "words", ...(search.book ? { book: search.book } : {}), ...(search.chapter ? { chapter: search.chapter } : {}), page: String(page) })}`;
  return <><PageHeader title={t("foundation.bibleSearch")} subtitle={t("foundation.searchHelp")} /><div className="container-page py-10">
    <form className="card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
      <label className="label sm:col-span-2">{t("common.search")}<input className="input mt-1" name="q" required maxLength={200} defaultValue={search.q} /></label>
      <label className="label">{t("bible.translation")}<select className="input mt-1" name="t" defaultValue={translation.id}>{editions.map((edition) => <option key={edition.id} value={edition.id}>{edition.name}</option>)}</select></label>
      <label className="label">{t("interface.type")}<select className="input mt-1" name="mode" defaultValue={search.mode || "words"}><option value="words">{t("foundation.words")}</option><option value="phrase">{t("foundation.phrase")}</option></select></label>
      <label className="label">{t("bible.chooseBook")}<select className="input mt-1" name="book" defaultValue={search.book || ""}><option value="">{t("common.seeAll")}</option>{editionBooks(translation.metadata, locale).map((book) => <option key={book.id} value={book.id}>{bookName(book.id, locale)}</option>)}</select></label>
      <label className="label">{t("bible.chapters")}<input className="input mt-1" type="number" min={1} max={150} name="chapter" defaultValue={search.chapter} /></label>
      <button className="self-end rounded-full bg-primary px-4 py-2.5 text-on-primary">{t("common.search")}</button>
    </form>
    {error && <p role="alert" className="mt-6 text-ink-muted">{error}</p>}
    {results?.reference && <Link className="mt-6 inline-block text-accent-ink" href={`/bible/${results.reference.bookId.toLowerCase()}/${results.reference.chapter}?t=${translation.id}#v${results.reference.verseStart || 1}`}>{bookName(results.reference.bookId, locale)} {results.reference.chapter}{results.reference.verseStart ? `:${results.reference.verseStart}` : ""}</Link>}
    {results && !results.reference && (!results.items.length ? <p className="mt-6 text-ink-muted">{t("foundation.noResults")}</p> : <ol className="mt-8 space-y-4">{results.items.map((verse) => <li key={`${verse.bookId}.${verse.chapter}.${verse.verse}`} className="card p-5"><Link className="font-semibold text-accent-ink" href={`/bible/${verse.bookId.toLowerCase()}/${verse.chapter}?t=${translation.id}#v${verse.verse}`}>{bookName(verse.bookId, locale)} {verse.chapter}:{verse.verse}</Link><p lang={translation.language} dir={scriptureDirection(translation.language)} className="mt-3 font-reading leading-relaxed">{verse.text}</p></li>)}</ol>)}
    {results && <nav className="mt-8 flex justify-between" aria-label={t("common.page", { page: results.page })}>{results.page > 1 ? <Link href={pageHref(results.page - 1)} className="text-accent-ink">{t("common.previous")}</Link> : <span />}{results.hasNext && <Link href={pageHref(results.page + 1)} className="text-accent-ink">{t("common.next")}</Link>}</nav>}
  </div></>;
}
