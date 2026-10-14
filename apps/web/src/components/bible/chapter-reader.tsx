"use client";

import { Bookmark, BookmarkCheck, Copy, NotebookPen, Share2, Trash2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatReference, highlightColors, passageKey, scriptureDirection, type HighlightColor } from "@cp/shared";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api-client";
import { writeLastLocation } from "@/lib/last-location";
import { useReaderPrefs } from "@/lib/reader-prefs";
import { ReadAloud } from "./read-aloud";

interface Verse {
  verse: number;
  text: string;
}
interface BookmarkRow {
  id: string;
  passageKey: string;
  verseStart: number | null;
  verseEnd: number | null;
}
interface NoteRow {
  id: string;
  verseStart: number | null;
  verseEnd: number | null;
  body: string;
}

const hlClass: Record<HighlightColor, string> = {
  gold: "bg-hl-gold",
  green: "bg-hl-green",
  blue: "bg-hl-blue",
  rose: "bg-hl-rose",
};

/** Groups selected verses into the smallest contiguous range for bookmarks/notes. */
const rangeOf = (selected: number[]) => ({ verseStart: Math.min(...selected), verseEnd: Math.max(...selected) });

export function ChapterReader(props: {
  bookId: string;
  chapter: number;
  translationId: string;
  translationAbbr: string;
  translationLanguage: string;
  readAloudAllowed: boolean;
  verses: Verse[];
  signedIn: boolean;
  accountSize?: number;
  initialHighlights: Record<number, string>;
  initialBookmarks: BookmarkRow[];
  initialNotes: NoteRow[];
}) {
  const t = useTranslations("bible");
  const tr = useTranslations("app.reader");
  const tc = useTranslations("app.common");
  const locale = useLocale();
  const { bookId, chapter, translationId, signedIn } = props;
  const prefs = useReaderPrefs(props.accountSize);

  const [selected, setSelected] = useState<number[]>([]);
  const [highlights, setHighlights] = useState(props.initialHighlights);
  const [bookmarks, setBookmarks] = useState(props.initialBookmarks);
  const [notes, setNotes] = useState(props.initialNotes);
  const [noteDraft, setNoteDraft] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const statusTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Remember the place on this device, and in reading history for signed-in readers.
  useEffect(() => {
    writeLastLocation({ bookId, chapter, translationId });
    if (signedIn) api("/me/history", { body: { bookId, chapter, translationId } }).catch(() => undefined);
  }, [signedIn, bookId, chapter, translationId]);

  const flash = useCallback((message: string) => {
    clearTimeout(statusTimer.current);
    setStatus(message);
    statusTimer.current = setTimeout(() => setStatus(null), 2200);
  }, []);

  useEffect(() => {
    if (!selected.length) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setSelected([]);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected.length]);

  const toggle = (verse: number) =>
    setSelected((s) => (s.includes(verse) ? s.filter((v) => v !== verse) : [...s, verse].sort((a, b) => a - b)));

  const selection = useMemo(() => (selected.length ? rangeOf(selected) : null), [selected]);
  const selectionRef = selection ? formatReference({ bookId, chapter, ...selection }, locale) : "";
  const selectionKey = selection ? passageKey({ bookId, chapter, ...selection }) : "";
  const existingBookmark = bookmarks.find((b) => b.passageKey === selectionKey);

  const selectedText = () =>
    props.verses
      .filter((v) => selected.includes(v.verse))
      .map((v) => v.text)
      .join(" ");
  const quote = () => `“${selectedText()}” — ${selectionRef} (${props.translationAbbr})`;

  async function setHighlight(color: HighlightColor | null) {
    const verses = selected;
    const prev = highlights;
    setHighlights((h) => {
      const next = { ...h };
      for (const v of verses) {
        if (color) next[v] = color;
        else delete next[v];
      }
      return next;
    });
    setSelected([]);
    try {
      await api("/me/highlights", { method: "PUT", body: { bookId, chapter, verses, color, translationId } });
    } catch {
      setHighlights(prev);
      flash(tc("error"));
    }
  }

  async function toggleBookmark() {
    if (!selection) return;
    try {
      if (existingBookmark) {
        await api(`/me/bookmarks/${existingBookmark.id}`, { method: "DELETE" });
        setBookmarks((b) => b.filter((x) => x.id !== existingBookmark.id));
      } else {
        const created = await api<BookmarkRow>("/me/bookmarks", {
          body: { passage: { bookId, chapter, ...selection }, translationId },
        });
        setBookmarks((b) => [...b, created]);
        flash(t("bookmarked"));
      }
      setSelected([]);
    } catch {
      flash(tc("error"));
    }
  }

  async function saveNote() {
    if (!selection || !noteDraft?.trim()) return;
    try {
      const created = await api<NoteRow>("/me/notes", {
        body: { passage: { bookId, chapter, ...selection }, body: noteDraft, translationId },
      });
      setNotes((n) => [...n, created]);
      setNoteDraft(null);
      setSelected([]);
      flash(tc("saved"));
    } catch {
      flash(tc("error"));
    }
  }

  async function deleteNote(id: string) {
    if (!confirm(tc("confirmDelete"))) return;
    try {
      await api(`/me/notes/${id}`, { method: "DELETE" });
      setNotes((n) => n.filter((x) => x.id !== id));
    } catch {
      flash(tc("error"));
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(quote()).then(() => flash(t("copied")), () => flash(tc("error")));
  }

  async function share() {
    const url = `${location.origin}${location.pathname}?t=${translationId}#v${selection?.verseStart ?? 1}`;
    if (navigator.share) await navigator.share({ text: quote(), url }).catch(() => undefined);
    else await navigator.clipboard.writeText(`${quote()}\n${url}`).then(() => flash(t("copied")), () => flash(tc("error")));
  }

  const notesByEnd = useMemo(() => {
    const map = new Map<number, NoteRow[]>();
    for (const n of notes) {
      const end = n.verseEnd ?? n.verseStart ?? 0;
      map.set(end, [...(map.get(end) ?? []), n]);
    }
    return map;
  }, [notes]);
  const bookmarkedVerses = useMemo(
    () => new Set(bookmarks.flatMap((b) => (b.verseStart === null ? [] : Array.from({ length: (b.verseEnd ?? b.verseStart) - b.verseStart + 1 }, (_, i) => b.verseStart! + i)))),
    [bookmarks],
  );
  const perLine = prefs.layout === "verses";

  const verseNodes = props.verses.map((v) => {
    const hl = highlights[v.verse] as HighlightColor | undefined;
    const isSel = selected.includes(v.verse);
    const verseNotes = notesByEnd.get(v.verse);
    const Wrapper = perLine ? "div" : "span";
    return (
      <Wrapper key={v.verse} className={perLine ? "mb-[0.55em]" : undefined}>
        <span
          id={`v${v.verse}`}
          role="button"
          tabIndex={0}
          aria-pressed={isSel}
          onClick={() => toggle(v.verse)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggle(v.verse);
            }
          }}
          className={`cursor-pointer scroll-mt-40 rounded-[3px] box-decoration-clone transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
            hl ? hlClass[hl] : "hover:bg-muted/70"
          } ${isSel ? "underline decoration-accent decoration-2 underline-offset-[0.3em]" : ""}`}
        >
          {prefs.numbers && (
            <sup className="verse-num">
              {v.verse}
              {bookmarkedVerses.has(v.verse) && <Bookmark className="ms-0.5 inline size-[0.9em] fill-current align-[-0.1em]" aria-label={t("bookmarked")} />}
            </sup>
          )}
          {v.text}
        </span>{" "}
        {verseNotes?.map((n) => (
          <span
            key={n.id}
            role="note"
            dir="auto"
            className="my-4 block rounded-2xl border border-line bg-muted/60 px-4 py-3 font-sans text-[0.9rem] leading-relaxed text-ink not-italic"
            style={{ fontSize: "0.95rem" }}
          >
            <span className="flex items-start justify-between gap-3">
              <span className="flex gap-2">
                <NotebookPen className="mt-1 size-3.5 shrink-0 text-accent-ink" aria-hidden />
                <span className="whitespace-pre-wrap">{n.body}</span>
              </span>
              <button type="button" onClick={() => deleteNote(n.id)} className="shrink-0 text-ink-muted hover:text-danger" aria-label={tc("delete")}>
                <Trash2 className="size-4" aria-hidden />
              </button>
            </span>
          </span>
        ))}
      </Wrapper>
    );
  });

  return (
    <div>
      <ReadAloud language={props.translationLanguage} allowed={props.readAloudAllowed} verses={props.verses} />

      <article
        className="scripture text-ink"
        lang={props.translationLanguage}
        dir={scriptureDirection(props.translationLanguage)}
      >
        {perLine ? verseNodes : <div>{verseNodes}</div>}
      </article>

      {!signedIn && (
        <p className="mt-10 text-center text-sm text-ink-muted">
          <Link href="/sign-in" className="text-accent-ink underline underline-offset-4">
            {tr("signInToSave")}
          </Link>
        </p>
      )}

      {selection && (
        <div
          role="toolbar"
          aria-label={`${tr("selection")}: ${selectionRef}`}
          className="glass fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 mx-auto w-[min(640px,calc(100%-1.5rem))] animate-rise rounded-[22px] p-3 shadow-2xl lg:bottom-6 [html[data-focus]_&]:bottom-6"
        >
          <div className="mb-2 flex items-center justify-between gap-2 px-1">
            <span className="font-display text-base font-semibold text-ink">{selectionRef}</span>
            <button type="button" onClick={() => setSelected([])} aria-label={tc("close")} className="icon-btn size-8">
              <X className="size-4" aria-hidden />
            </button>
          </div>
          {noteDraft !== null ? (
            <div className="space-y-2">
              <label className="sr-only" htmlFor="note-draft">{tr("noteFor", { reference: selectionRef })}</label>
              <textarea
                id="note-draft"
                autoFocus
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder={t("notePlaceholder")}
                rows={3}
                maxLength={10000}
                className="input resize-y"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setNoteDraft(null)} className="h-9 rounded-full px-4 text-sm hover:bg-muted">
                  {tc("cancel")}
                </button>
                <button type="button" onClick={saveNote} disabled={!noteDraft.trim()} className="h-9 rounded-full bg-primary px-4 text-sm font-medium text-on-primary disabled:opacity-50">
                  {tc("save")}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {signedIn ? (
                <>
                  <span className="flex items-center gap-1.5" role="group" aria-label={t("highlight")}>
                    {highlightColors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setHighlight(c)}
                        className={`size-8 rounded-full border border-line transition hover:scale-110 ${hlClass[c]}`}
                        aria-label={`${t("highlight")}: ${c}`}
                      />
                    ))}
                    <button type="button" onClick={() => setHighlight(null)} className="inline-flex size-8 items-center justify-center rounded-full border border-line text-ink-muted" aria-label={t("removeHighlight")}>
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </span>
                  <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden />
                  <ToolButton onClick={toggleBookmark} icon={existingBookmark ? BookmarkCheck : Bookmark}>
                    {existingBookmark ? t("bookmarked") : t("bookmark")}
                  </ToolButton>
                  <ToolButton onClick={() => setNoteDraft("")} icon={NotebookPen}>
                    {t("addNote")}
                  </ToolButton>
                </>
              ) : (
                <Link href="/sign-in" className="me-auto text-sm text-accent-ink underline underline-offset-4">
                  {tr("signInToSave")}
                </Link>
              )}
              <ToolButton onClick={copy} icon={Copy}>
                {t("copy")}
              </ToolButton>
              <ToolButton onClick={share} icon={Share2}>
                {t("share")}
              </ToolButton>
            </div>
          )}
        </div>
      )}
      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>
      {status && (
        <div className="fixed top-16 left-1/2 z-50 -translate-x-1/2 animate-fade rounded-full bg-primary px-4 py-2 text-sm text-on-primary shadow-lg lg:top-6">
          {status}
        </div>
      )}
    </div>
  );
}

function ToolButton({
  onClick,
  icon: Icon,
  children,
}: {
  onClick: () => void;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-sm text-ink transition hover:border-accent">
      <Icon className="size-4" aria-hidden />
      {children}
    </button>
  );
}
