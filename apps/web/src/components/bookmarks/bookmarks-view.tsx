"use client";

import { Bookmark, Highlighter, History, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { EmptyState } from "@/components/ui/page-header";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api-client";

export interface SavedBookmark {
  id: string;
  label: string;
  href: string;
  translation: string;
  text: string | null;
  lang?: string;
  dir?: "ltr" | "rtl";
}
export interface SavedHighlight {
  id: string;
  label: string;
  href: string;
  color: string;
  translation: string;
  remove: { bookId: string; chapter: number; verse: number; translationId: string };
}
export interface HistoryItem {
  id: string;
  label: string;
  href: string;
  meta: string;
}

const swatch: Record<string, string> = { gold: "bg-hl-gold", green: "bg-hl-green", blue: "bg-hl-blue", rose: "bg-hl-rose" };

export function BookmarksView({ bookmarks: initialBookmarks, highlights: initialHighlights, history }: { bookmarks: SavedBookmark[]; highlights: SavedHighlight[]; history: HistoryItem[] }) {
  const t = useTranslations("app.bookmarks");
  const tc = useTranslations("app.common");
  const [tab, setTab] = useState<"bookmarks" | "highlights" | "history">("bookmarks");
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [highlights, setHighlights] = useState(initialHighlights);
  const [error, setError] = useState(false);

  async function removeBookmark(id: string) {
    try {
      await api(`/me/bookmarks/${id}`, { method: "DELETE" });
      setBookmarks((list) => list.filter((b) => b.id !== id));
    } catch {
      setError(true);
    }
  }
  async function removeHighlight(item: SavedHighlight) {
    try {
      await api("/me/highlights", { method: "PUT", body: { ...item.remove, verses: [item.remove.verse], color: null } });
      setHighlights((list) => list.filter((h) => h.id !== item.id));
    } catch {
      setError(true);
    }
  }

  const tabs = [
    { key: "bookmarks", icon: Bookmark, count: bookmarks.length },
    { key: "highlights", icon: Highlighter, count: highlights.length },
    { key: "history", icon: History, count: history.length },
  ] as const;

  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto" role="group">
        {tabs.map(({ key, icon: Icon, count }) => (
          <button key={key} type="button" className="chip shrink-0" aria-pressed={tab === key} onClick={() => setTab(key)}>
            <Icon className="size-4" aria-hidden />
            {t(key)}
            <span className="tabular-nums opacity-70">{count}</span>
          </button>
        ))}
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-danger">{tc("error")}</p>}

      <div className="mt-6">
        {tab === "bookmarks" &&
          (bookmarks.length ? (
            <ul className="grid gap-4 md:grid-cols-2">
              {bookmarks.map((b) => (
                <li key={b.id} className="card flex flex-col gap-3 p-5">
                  <div className="flex items-center gap-2">
                    <Link href={b.href} className="me-auto font-display text-lg font-semibold text-ink hover:text-accent-ink">
                      {b.label}
                    </Link>
                    <span className="text-xs text-ink-muted">{b.translation}</span>
                    <button type="button" className="icon-btn size-9 hover:text-danger" aria-label={tc("remove")} onClick={() => removeBookmark(b.id)}>
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                  {b.text && (
                    <p lang={b.lang} dir={b.dir} className="scripture line-clamp-4 text-ink-muted [--reader-leading:1.6] [--reader-size:1.02rem]">
                      {b.text}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>{t("emptyBookmarks")}</EmptyState>
          ))}

        {tab === "highlights" &&
          (highlights.length ? (
            <ul className="divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-surface">
              {highlights.map((h) => (
                <li key={h.id} className="flex items-center gap-3 px-5 py-3">
                  <span className={`size-4 shrink-0 rounded-full border border-line ${swatch[h.color] ?? "bg-muted"}`} aria-hidden />
                  <Link href={h.href} className="me-auto font-medium text-ink hover:text-accent-ink">
                    {h.label}
                  </Link>
                  <span className="text-xs text-ink-muted">{h.translation}</span>
                  <button type="button" className="icon-btn size-9 hover:text-danger" aria-label={tc("remove")} onClick={() => removeHighlight(h)}>
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>{t("emptyHighlights")}</EmptyState>
          ))}

        {tab === "history" &&
          (history.length ? (
            <ul className="divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-surface">
              {history.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-muted">
                    <span className="font-medium text-ink">{item.label}</span>
                    <span className="text-xs text-ink-muted">{item.meta}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>{t("emptyHistory")}</EmptyState>
          ))}
      </div>
    </div>
  );
}
