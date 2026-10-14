"use client";

import { BookOpen, Lock, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { formatReference, parsePassageKey, parseReference, passageKey } from "@cp/shared";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/page-header";
import { Sheet } from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api-client";

export interface JournalEntry {
  id: string;
  title: string;
  body: string;
  refs: string[];
  createdAt: string;
  updatedAt: string;
}
export interface VerseNote {
  id: string;
  bookId: string;
  chapter: number;
  verseStart: number | null;
  verseEnd: number | null;
  translationId: string | null;
  body: string;
  updatedAt: string;
}

type Draft = { id?: string; title: string; body: string; refs: string };

export function JournalView({ entries: initialEntries, notes: initialNotes }: { entries: JournalEntry[]; notes: VerseNote[] }) {
  const t = useTranslations("app.journal");
  const tc = useTranslations("app.common");
  const locale = useLocale();
  const [tab, setTab] = useState<"entries" | "notes">("entries");
  const [entries, setEntries] = useState(initialEntries);
  const [notes, setNotes] = useState(initialNotes);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [noteDraft, setNoteDraft] = useState<{ id: string; body: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const label = (key: string) => {
    const passage = parsePassageKey(key);
    return passage ? formatReference(passage, locale) : key;
  };
  const href = (key: string, translationId?: string | null) => {
    const passage = parsePassageKey(key);
    if (!passage) return "/bible";
    return `/bible/${passage.bookId.toLowerCase()}/${passage.chapter}${translationId ? `?t=${translationId}` : ""}${passage.verseStart ? `#v${passage.verseStart}` : ""}`;
  };
  const date = (iso: string) => new Date(iso).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });

  const q = query.trim().toLocaleLowerCase();
  const visibleEntries = useMemo(
    () => entries.filter((e) => !q || `${e.title} ${e.body} ${e.refs.map(label).join(" ")}`.toLocaleLowerCase().includes(q)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- label depends only on locale
    [entries, q, locale],
  );
  const noteKey = (n: VerseNote) => passageKey({ bookId: n.bookId, chapter: n.chapter, verseStart: n.verseStart ?? undefined, verseEnd: n.verseEnd ?? undefined });
  const visibleNotes = useMemo(
    () => notes.filter((n) => !q || `${n.body} ${label(noteKey(n))}`.toLocaleLowerCase().includes(q)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- label depends only on locale
    [notes, q, locale],
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    const parts = draft.refs.split(/[;\n]/).map((part) => part.trim()).filter(Boolean);
    const refs: string[] = [];
    for (const part of parts) {
      const passage = parseReference(part);
      if (!passage) {
        setFormError(t("invalidRef", { ref: part }));
        return;
      }
      refs.push(passageKey(passage));
    }
    setFormError(null);
    setBusy(true);
    try {
      const body = { title: draft.title, body: draft.body, refs };
      const saved = draft.id ? await api<JournalEntry>(`/me/journal/${draft.id}`, { method: "PATCH", body }) : await api<JournalEntry>("/me/journal", { body });
      setEntries((list) => [saved, ...list.filter((e) => e.id !== saved.id)]);
      setDraft(null);
    } catch {
      setFormError(tc("error"));
    } finally {
      setBusy(false);
    }
  }

  async function removeEntry(id: string) {
    if (!confirm(tc("confirmDelete"))) return;
    try {
      await api(`/me/journal/${id}`, { method: "DELETE" });
      setEntries((list) => list.filter((e) => e.id !== id));
    } catch {
      setError(true);
    }
  }

  async function saveNote(event: React.FormEvent) {
    event.preventDefault();
    if (!noteDraft?.body.trim()) return;
    setBusy(true);
    try {
      const saved = await api<{ body: string; updatedAt: string }>(`/me/notes/${noteDraft.id}`, { method: "PATCH", body: { body: noteDraft.body } });
      setNotes((list) => list.map((n) => (n.id === noteDraft.id ? { ...n, body: saved.body, updatedAt: saved.updatedAt } : n)));
      setNoteDraft(null);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  async function removeNote(id: string) {
    if (!confirm(tc("confirmDelete"))) return;
    try {
      await api(`/me/notes/${id}`, { method: "DELETE" });
      setNotes((list) => list.filter((n) => n.id !== id));
    } catch {
      setError(true);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="segmented sm:w-72" role="group">
          {(["entries", "notes"] as const).map((value) => (
            <button key={value} type="button" aria-pressed={tab === value} onClick={() => setTab(value)}>
              {value === "entries" ? t("entries") : t("verseNotes")}
            </button>
          ))}
        </div>
        <label className="relative sm:ms-auto sm:w-64">
          <span className="sr-only">{t("search")}</span>
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} className="input h-10 rounded-full ps-9" />
        </label>
        <button type="button" onClick={() => { setFormError(null); setDraft({ title: "", body: "", refs: "" }); }} className={buttonClass("primary", "md")}>
          <Plus className="size-4" aria-hidden />
          {t("new")}
        </button>
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-danger">{tc("error")}</p>}

      <div className="mt-6">
        {tab === "entries" ? (
          !entries.length ? (
            <EmptyState>{t("empty")}</EmptyState>
          ) : !visibleEntries.length ? (
            <p className="py-10 text-center text-ink-muted">{t("noMatches")}</p>
          ) : (
            <ul className="space-y-4">
              {visibleEntries.map((entry) => (
                <li key={entry.id} className="card p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-ink-muted">{date(entry.createdAt)}</p>
                      <h2 className="mt-1 font-display text-xl font-semibold text-ink" dir="auto">{entry.title}</h2>
                    </div>
                    <button type="button" className="icon-btn size-9" aria-label={t("edit")} onClick={() => { setFormError(null); setDraft({ id: entry.id, title: entry.title, body: entry.body, refs: entry.refs.map(label).join("; ") }); }}>
                      <Pencil className="size-4" aria-hidden />
                    </button>
                    <button type="button" className="icon-btn size-9 hover:text-danger" aria-label={tc("delete")} onClick={() => removeEntry(entry.id)}>
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                  {entry.body && <p className="mt-3 leading-relaxed whitespace-pre-wrap text-ink-muted" dir="auto">{entry.body}</p>}
                  {entry.refs.length > 0 && (
                    <p className="mt-4 flex flex-wrap gap-2">
                      {entry.refs.map((key) => (
                        <Link key={key} href={href(key)} className="chip">
                          <BookOpen className="size-3.5" aria-hidden />
                          {label(key)}
                        </Link>
                      ))}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )
        ) : !notes.length ? (
          <EmptyState>{t("noNotes")}</EmptyState>
        ) : !visibleNotes.length ? (
          <p className="py-10 text-center text-ink-muted">{t("noMatches")}</p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {visibleNotes.map((note) => (
              <li key={note.id} className="card flex flex-col gap-3 p-5">
                <div className="flex items-center gap-2">
                  <Link href={href(noteKey(note), note.translationId)} className="me-auto font-medium text-accent-ink hover:underline">
                    {label(noteKey(note))}
                  </Link>
                  <button type="button" className="icon-btn size-9" aria-label={tc("edit")} onClick={() => setNoteDraft({ id: note.id, body: note.body })}>
                    <Pencil className="size-4" aria-hidden />
                  </button>
                  <button type="button" className="icon-btn size-9 hover:text-danger" aria-label={tc("delete")} onClick={() => removeNote(note.id)}>
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
                <p className="leading-relaxed whitespace-pre-wrap text-ink" dir="auto">{note.body}</p>
                <p className="mt-auto text-xs text-ink-muted">{tc("updated", { date: date(note.updatedAt) })}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Sheet open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? t("edit") : t("new")}>
        {draft && (
          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="label">{t("titleLabel")}</span>
              <input className="input" required maxLength={160} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} autoFocus />
            </label>
            <label className="block">
              <span className="label">{t("bodyLabel")}</span>
              <textarea className="input min-h-40 resize-y" maxLength={50000} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
            </label>
            <label className="block">
              <span className="label">
                {t("refs")} <span className="font-normal text-ink-muted">({tc("optional")})</span>
              </span>
              <input className="input" value={draft.refs} onChange={(e) => setDraft({ ...draft, refs: e.target.value })} aria-describedby="refs-hint" aria-invalid={!!formError} />
              <span id="refs-hint" className="mt-1.5 block text-xs text-ink-muted">{t("refsHint")}</span>
            </label>
            {formError && <p role="alert" className="text-sm text-danger">{formError}</p>}
            <p className="flex items-center gap-1.5 text-xs text-ink-muted">
              <Lock className="size-3.5" aria-hidden />
              {tc("private")}
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDraft(null)} className={buttonClass("ghost", "md")}>{tc("cancel")}</button>
              <button type="submit" disabled={busy || !draft.title.trim()} className={buttonClass("primary", "md")}>{busy ? tc("saving") : tc("save")}</button>
            </div>
          </form>
        )}
      </Sheet>

      <Sheet open={!!noteDraft} onClose={() => setNoteDraft(null)} title={tc("edit")}>
        {noteDraft && (
          <form onSubmit={saveNote} className="space-y-4">
            <textarea className="input min-h-36 resize-y" maxLength={10000} value={noteDraft.body} onChange={(e) => setNoteDraft({ ...noteDraft, body: e.target.value })} autoFocus aria-label={t("verseNotes")} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setNoteDraft(null)} className={buttonClass("ghost", "md")}>{tc("cancel")}</button>
              <button type="submit" disabled={busy || !noteDraft.body.trim()} className={buttonClass("primary", "md")}>{busy ? tc("saving") : tc("save")}</button>
            </div>
          </form>
        )}
      </Sheet>
    </div>
  );
}
