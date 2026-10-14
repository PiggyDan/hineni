"use client";

import { CircleCheck, Lock, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { prayerCategories } from "@cp/shared";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/page-header";
import { Sheet } from "@/components/ui/sheet";
import { api } from "@/lib/api-client";

export interface PrayerView {
  id: string;
  title: string;
  body: string;
  category: (typeof prayerCategories)[number];
  answered: boolean;
  answerNote: string | null;
  createdAt: string;
  updatedAt: string;
}

type Filter = "all" | "open" | "answered";
type Draft = { id?: string; title: string; body: string; category: PrayerView["category"] };

export function PrayerJournal({ initial, startNew = false }: { initial: PrayerView[]; startNew?: boolean }) {
  const t = useTranslations("app.prayer");
  const tp = useTranslations("prayer");
  const tc = useTranslations("app.common");
  const locale = useLocale();
  const [prayers, setPrayers] = useState(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Draft | null>(startNew ? { title: "", body: "", category: "PERSONAL" } : null);
  const [answering, setAnswering] = useState<{ id: string; note: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return prayers.filter(
      (p) =>
        (filter === "all" || (filter === "answered" ? p.answered : !p.answered)) &&
        (!q || `${p.title} ${p.body} ${p.answerNote ?? ""}`.toLocaleLowerCase().includes(q)),
    );
  }, [prayers, filter, query]);

  const date = (iso: string) => new Date(iso).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
  const replace = (next: PrayerView) => setPrayers((list) => [next, ...list.filter((p) => p.id !== next.id)]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft?.title.trim()) return;
    setBusy(true);
    setError(false);
    try {
      const body = { title: draft.title, body: draft.body, category: draft.category };
      const saved = draft.id
        ? await api<PrayerView>(`/me/prayer/${draft.id}`, { method: "PATCH", body })
        : await api<PrayerView>("/me/prayer", { body });
      replace(saved);
      setDraft(null);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  async function setAnswered(prayer: PrayerView, answered: boolean, answerNote?: string) {
    try {
      replace(await api<PrayerView>(`/me/prayer/${prayer.id}`, { method: "PATCH", body: { answered, ...(answerNote !== undefined ? { answerNote } : {}) } }));
      setAnswering(null);
    } catch {
      setError(true);
    }
  }

  async function remove(id: string) {
    if (!confirm(tc("confirmDelete"))) return;
    try {
      await api(`/me/prayer/${id}`, { method: "DELETE" });
      setPrayers((list) => list.filter((p) => p.id !== id));
    } catch {
      setError(true);
    }
  }

  const counts = { all: prayers.length, open: prayers.filter((p) => !p.answered).length, answered: prayers.filter((p) => p.answered).length };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-1.5 overflow-x-auto" role="group" aria-label={tp("category")}>
          {(["all", "open", "answered"] as const).map((value) => (
            <button key={value} type="button" className="chip shrink-0" aria-pressed={filter === value} onClick={() => setFilter(value)}>
              {value === "all" ? t("all") : value === "open" ? t("praying") : t("answered")}
              <span className="tabular-nums opacity-70">{counts[value]}</span>
            </button>
          ))}
        </div>
        <label className="relative sm:ms-auto sm:w-64">
          <span className="sr-only">{t("search")}</span>
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} className="input h-10 rounded-full ps-9" />
        </label>
        <button type="button" onClick={() => setDraft({ title: "", body: "", category: "PERSONAL" })} className={buttonClass("primary", "md")}>
          <Plus className="size-4" aria-hidden />
          {t("new")}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {tc("error")}
        </p>
      )}

      <div className="mt-6">
        {!prayers.length ? (
          <EmptyState>{t("empty")}</EmptyState>
        ) : !visible.length ? (
          <p className="py-10 text-center text-ink-muted">{t("noMatches")}</p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {visible.map((prayer) => (
              <li key={prayer.id} className={`card flex flex-col gap-3 p-5 ${prayer.answered ? "border-secondary/40" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-lg font-semibold text-ink" dir="auto">{prayer.title}</h2>
                  <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[0.7rem] font-medium tracking-wide text-ink-muted uppercase">
                    {tp(`categories.${prayer.category}`)}
                  </span>
                </div>
                {prayer.body && <p className="line-clamp-6 text-[0.95rem] leading-relaxed whitespace-pre-wrap text-ink-muted" dir="auto">{prayer.body}</p>}
                {prayer.answered && (
                  <div className="rounded-2xl bg-secondary/10 p-3.5">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-secondary">
                      <CircleCheck className="size-4" aria-hidden />
                      {t("answered")}
                    </p>
                    {prayer.answerNote && <p className="mt-1.5 text-sm whitespace-pre-wrap text-ink" dir="auto">{prayer.answerNote}</p>}
                  </div>
                )}
                <div className="mt-auto flex flex-wrap items-center gap-1 pt-1">
                  <span className="me-auto text-xs text-ink-muted">{date(prayer.updatedAt)}</span>
                  {prayer.answered ? (
                    <button type="button" onClick={() => setAnswered(prayer, false)} className="h-9 rounded-full px-3 text-sm text-ink-muted hover:bg-muted hover:text-ink">
                      {t("markPraying")}
                    </button>
                  ) : (
                    <button type="button" onClick={() => setAnswering({ id: prayer.id, note: prayer.answerNote ?? "" })} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-secondary hover:bg-muted">
                      <CircleCheck className="size-4" aria-hidden />
                      {t("markAnswered")}
                    </button>
                  )}
                  <button type="button" className="icon-btn size-9" aria-label={t("edit")} onClick={() => setDraft({ id: prayer.id, title: prayer.title, body: prayer.body, category: prayer.category })}>
                    <Pencil className="size-4" aria-hidden />
                  </button>
                  <button type="button" className="icon-btn size-9 hover:text-danger" aria-label={tc("delete")} onClick={() => remove(prayer.id)}>
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
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
              <textarea className="input min-h-36 resize-y" maxLength={20000} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
            </label>
            <label className="block">
              <span className="label">{t("category")}</span>
              <select className="input" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as Draft["category"] })}>
                {prayerCategories.map((category) => (
                  <option key={category} value={category}>
                    {tp(`categories.${category}`)}
                  </option>
                ))}
              </select>
            </label>
            <p className="flex items-center gap-1.5 text-xs text-ink-muted">
              <Lock className="size-3.5" aria-hidden />
              {tc("private")}
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDraft(null)} className={buttonClass("ghost", "md")}>
                {tc("cancel")}
              </button>
              <button type="submit" disabled={busy || !draft.title.trim()} className={buttonClass("primary", "md")}>
                {busy ? tc("saving") : tc("save")}
              </button>
            </div>
          </form>
        )}
      </Sheet>

      <Sheet open={!!answering} onClose={() => setAnswering(null)} title={t("markAnswered")}>
        {answering && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const prayer = prayers.find((p) => p.id === answering.id);
              if (prayer) void setAnswered(prayer, true, answering.note.trim());
            }}
          >
            <label className="block">
              <span className="label">{t("answerNote")}</span>
              <textarea className="input min-h-28 resize-y" maxLength={5000} placeholder={t("answerNotePlaceholder")} value={answering.note} onChange={(e) => setAnswering({ ...answering, note: e.target.value })} autoFocus />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAnswering(null)} className={buttonClass("ghost", "md")}>
                {tc("cancel")}
              </button>
              <button type="submit" className={buttonClass("primary", "md")}>
                <CircleCheck className="size-4" aria-hidden />
                {t("markAnswered")}
              </button>
            </div>
          </form>
        )}
      </Sheet>
    </div>
  );
}
