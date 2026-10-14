"use client";

import { BookOpen, Check, ChevronDown, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Link } from "@/i18n/navigation";

export interface PickerBook { id: string; name: string; chapters: number; testament: "OT" | "NT" }

export function BookChapterPicker({ books, bookId = "GEN", chapter = 1, translationId, inline = false }: {
  books: PickerBook[]; bookId?: string; chapter?: number; translationId?: string; inline?: boolean;
}) {
  const t = useTranslations();
  const dialog = useRef<HTMLDialogElement>(null);
  const current = books.find((book) => book.id === bookId) ?? books[0]!;
  const [selectedId, setSelectedId] = useState(current.id);
  const [panel, setPanel] = useState<"books" | "chapters">("books");
  const [testament, setTestament] = useState<"OT" | "NT">(current.testament);
  const [query, setQuery] = useState("");
  const selected = books.find((book) => book.id === selectedId) ?? current;
  const normalized = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const matching = books.filter((book) => query.trim() ? normalized(book.name).includes(normalized(query.trim())) || book.id.toLowerCase().includes(query.trim().toLowerCase()) : book.testament === testament);

  function chooseBook(id: string) {
    setSelectedId(id); setPanel("chapters");
    if (!dialog.current?.open) dialog.current?.showModal();
  }

  const bookList = <>
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1" role="group" aria-label={t("bible.chooseBook")}>
      {(["OT", "NT"] as const).map((value) => <button key={value} type="button" aria-pressed={testament === value} onClick={() => { setTestament(value); setQuery(""); }} className={`min-h-11 rounded-lg px-3 py-2 text-sm transition ${testament === value ? "bg-surface font-semibold text-ink shadow-sm" : "text-ink-muted hover:text-ink"}`}>{t(value === "OT" ? "bible.oldTestament" : "bible.newTestament")}</button>)}
    </div>
    <label className="relative mt-4 block">
      <span className="sr-only">{t("readerUI.findBook")}</span><Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-ink-muted" aria-hidden />
      <input type="search" className="input min-h-11 rounded-xl pl-10" placeholder={t("readerUI.findBook")} value={query} onChange={(event) => setQuery(event.target.value)} />
    </label>
    <ul className="mt-4 divide-y divide-line">
      {matching.map((book) => <li key={book.id}><button type="button" onClick={() => chooseBook(book.id)} className="flex min-h-14 w-full items-center gap-3 rounded-lg px-3 py-3 text-start hover:bg-muted focus-visible:bg-muted">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-medium text-ink-muted">{books.findIndex((value) => value.id === book.id) + 1}</span>
        <span className="flex-1 font-medium">{book.name}</span><span className="text-xs text-ink-muted">{book.chapters}</span><ChevronRight className="size-4 text-ink-muted" aria-hidden />
      </button></li>)}
    </ul>
    {!matching.length && <p className="py-6 text-center text-sm text-ink-muted">{t("foundation.noResults")}</p>}
  </>;

  return <>
    {inline ? bookList : <button type="button" aria-haspopup="dialog" onClick={() => { setSelectedId(current.id); setTestament(current.testament); setQuery(""); setPanel("books"); dialog.current?.showModal(); }} className="inline-flex h-10 min-w-0 items-center gap-2 rounded-full px-3 text-[0.95rem] font-semibold text-ink transition hover:bg-muted">
      <BookOpen className="size-4 shrink-0 text-accent-ink" aria-hidden /><span className="truncate">{current.name} {chapter}</span><ChevronDown className="size-4 shrink-0 text-ink-muted" aria-hidden />
    </button>}
    <dialog ref={dialog} aria-label={panel === "books" ? t("readerUI.bookChapter") : `${selected.name} — ${t("readerUI.chooseChapter")}`} className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[85dvh] w-full max-w-none overflow-hidden rounded-t-[28px] border border-line bg-surface p-0 text-ink shadow-2xl open:animate-rise sm:inset-0 sm:m-auto sm:max-h-[80dvh] sm:max-w-lg sm:rounded-[24px]" onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-line sm:hidden" aria-hidden />
      <header className="flex items-center gap-3 border-b border-line px-5 py-4">
        {panel === "chapters" && <button type="button" aria-label={t("bible.chooseBook")} onClick={() => setPanel("books")} className="flex size-10 items-center justify-center rounded-full hover:bg-muted"><ChevronLeft className="size-5" aria-hidden /></button>}
        <div className="flex-1"><h2 className="font-sans text-lg font-semibold">{panel === "books" ? t("readerUI.bookChapter") : selected.name}</h2><p className="mt-0.5 text-xs text-ink-muted">{panel === "books" ? t("bible.chooseBook") : t("readerUI.chooseChapter")}</p></div>
        <button type="button" aria-label={t("common.close")} onClick={() => dialog.current?.close()} className="flex size-10 items-center justify-center rounded-full hover:bg-muted"><X className="size-5" aria-hidden /></button>
      </header>
      <div className="max-h-[65dvh] overflow-y-auto overscroll-contain p-5">
        {panel === "books" ? bookList : <ol className="grid grid-cols-5 gap-2 sm:grid-cols-6" aria-label={t("bible.chapters")}>
          {Array.from({ length: selected.chapters }, (_, index) => index + 1).map((number) => <li key={number}><Link onClick={() => dialog.current?.close()} href={`/bible/${selected.id.toLowerCase()}/${number}${translationId ? `?t=${encodeURIComponent(translationId)}` : ""}`} aria-current={selected.id === bookId && chapter === number ? "page" : undefined} className={`relative flex min-h-12 items-center justify-center rounded-xl border text-sm font-medium transition ${selected.id === bookId && chapter === number ? "border-accent bg-primary text-on-primary" : "border-line bg-muted/40 hover:border-accent hover:bg-muted"}`}>
            {number}{selected.id === bookId && chapter === number && <Check className="absolute right-1 top-1 size-2.5" aria-hidden />}
          </Link></li>)}
        </ol>}
      </div>
    </dialog>
  </>;
}
