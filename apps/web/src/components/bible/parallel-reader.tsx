import { editionBooks, scriptureDirection } from "@cp/shared";
import { getTranslations } from "next-intl/server";
import { getChapter, getTranslation, listTranslations } from "@/lib/bible";

/** Independent references deliberately avoid assuming identical verse numbering. */
export async function ParallelReader({ locale, primaryId, bookId, chapter, compare, compareBook, compareChapter }: {
  locale: string; primaryId: string; bookId: string; chapter: number;
  compare?: string; compareBook?: string; compareChapter?: string;
}) {
  const t = await getTranslations("bible");
  const options = await listTranslations();
  const edition = compare ? await getTranslation(compare) : null;
  const books = editionBooks(edition?.metadata, locale);
  const selectedBook = compareBook ?? bookId;
  const selectedChapter = Number(compareChapter ?? chapter);
  const text = edition ? await getChapter(edition, selectedBook, selectedChapter).catch(() => null) : null;
  const field = "h-10 rounded-xl border border-line bg-surface px-3 text-sm text-ink";
  return (
    <section className="animate-rise xl:border-s xl:border-line xl:ps-12" aria-label={t("parallel")}>
      <form className="card-soft mb-8 flex flex-wrap items-end gap-3 p-4">
        <input type="hidden" name="t" value={primaryId} />
        <label className="flex min-w-40 flex-1 flex-col gap-1 text-xs font-medium text-ink-muted">{t("comparisonEdition")}
          <select name="compare" defaultValue={compare ?? ""} className={field}>
            <option value="">{t("chooseTranslation")}</option>
            {options.map(item => <option key={item.id} value={item.id}>{item.abbreviation} — {item.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-ink-muted">{t("chooseBook")}
          <select name="compareBook" defaultValue={selectedBook} className={field}>
            {!books.some(book => book.id === selectedBook) && <option value={selectedBook}>{selectedBook}</option>}
            {books.map(book => <option key={book.id} value={book.id}>{book.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-ink-muted">{t("chapters")}
          <input name="compareChapter" type="number" min="1" max="200" defaultValue={selectedChapter} className={`${field} w-20`} />
        </label>
        <button className="h-10 rounded-full bg-primary px-4 text-sm font-medium text-on-primary">{t("parallel")}</button>
        <p className="basis-full text-xs leading-relaxed text-ink-muted">{t("nativeNumbering")}</p>
      </form>
      {compare && (edition && text ? <div>
        <header className="mb-10 text-center">
          <p className="mb-5 text-[0.7rem] font-semibold tracking-[0.18em] text-ink-muted uppercase">{edition.name}</p>
          <p className="text-xs font-semibold tracking-[0.22em] text-ink-muted uppercase">{books.find(book => book.id === selectedBook)?.name ?? selectedBook}</p>
          <p className="mt-2 font-display text-6xl font-semibold text-accent-ink sm:text-7xl">{selectedChapter}</p>
        </header>
        <div lang={edition.language} dir={scriptureDirection(edition.language)} className="scripture text-ink">
          {text.verses.map(verse => <p key={verse.verse} className="mb-[0.55em]"><sup className="verse-num">{verse.verse}</sup>{verse.text}</p>)}
        </div>
        <p className="mt-12 text-center text-xs leading-relaxed text-ink-muted">{text.copyright}</p>
      </div> : <p role="status" className="text-center text-ink-muted">{t("unavailable")}</p>)}
    </section>
  );
}
