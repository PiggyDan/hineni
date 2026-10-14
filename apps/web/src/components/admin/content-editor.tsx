"use client";

import { Pencil, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { contentStatuses, contentTypes, localeNames, locales } from "@cp/shared";
import { buttonClass } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { useRouter } from "@/i18n/navigation";
import { api, ApiClientError } from "@/lib/api-client";

export interface AdminContent {
  id: string;
  type: (typeof contentTypes)[number];
  slug: string;
  locale: (typeof locales)[number];
  title: string;
  summary: string;
  body: string;
  author: string;
  scriptureRefs: string[];
  publishDate: string;
  featured: boolean;
  status: (typeof contentStatuses)[number];
  updatedAt: string;
}

type Form = Omit<AdminContent, "id" | "updatedAt" | "scriptureRefs"> & { id?: string; refsText: string };

const empty = (locale: AdminContent["locale"]): Form => ({
  type: "DEVOTIONAL", slug: "", locale, title: "", summary: "", body: "", author: "", publishDate: new Date().toISOString().slice(0, 10), featured: false, status: "DRAFT", refsText: "",
});

export function ContentEditor({ items, defaultLocale }: { items: AdminContent[]; defaultLocale: AdminContent["locale"] }) {
  const t = useTranslations("app.admin");
  const tc = useTranslations("app.common");
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    setBusy(true);
    setError(null);
    const { id, refsText, summary, author, publishDate, ...rest } = form;
    const body = {
      ...rest,
      ...(summary.trim() ? { summary } : {}),
      ...(author.trim() ? { author } : {}),
      ...(publishDate ? { publishDate } : {}),
      scriptureRefs: refsText.split(";").map((ref) => ref.trim()).filter(Boolean),
    };
    try {
      await api(id ? `/admin/content/${id}` : "/admin/content", { method: id ? "PATCH" : "POST", body });
      setForm(null);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof ApiClientError && cause.code === "slug_taken" ? t("slugTaken") : tc("error"));
    } finally {
      setBusy(false);
    }
  }

  const statusTone: Record<AdminContent["status"], string> = {
    PUBLISHED: "bg-secondary/15 text-secondary",
    IN_REVIEW: "bg-accent/15 text-accent-ink",
    DRAFT: "bg-muted text-ink-muted",
    ARCHIVED: "bg-muted text-ink-muted line-through",
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button type="button" className={buttonClass("primary", "md")} onClick={() => { setError(null); setForm(empty(defaultLocale)); }}>
          <Plus className="size-4" aria-hidden />
          {t("newContent")}
        </button>
      </div>
      {items.length ? (
        <ul className="divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-surface">
          {items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{item.title}</p>
                <p className="text-xs text-ink-muted">
                  {t(`types.${item.type}`)} · {localeNames[item.locale]} · /{item.slug}
                  {item.publishDate && ` · ${item.publishDate}`}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone[item.status]}`}>{t(`statuses.${item.status}`)}</span>
              <button
                type="button"
                className="icon-btn size-9"
                aria-label={`${t("editContent")}: ${item.title}`}
                onClick={() => {
                  setError(null);
                  const { id, updatedAt: _updatedAt, scriptureRefs, ...rest } = item;
                  void _updatedAt;
                  setForm({ ...rest, id, refsText: scriptureRefs.join("; ") });
                }}
              >
                <Pencil className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="card-soft p-8 text-center text-ink-muted">{t("noContent")}</p>
      )}

      <Sheet open={!!form} onClose={() => setForm(null)} title={form?.id ? t("editContent") : t("newContent")}>
        {form && (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="label">{t("type")}</span>
                <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Form["type"] })}>
                  {contentTypes.map((type) => <option key={type} value={type}>{t(`types.${type}`)}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="label">{t("locale")}</span>
                <select className="input" value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value as Form["locale"] })}>
                  {locales.map((locale) => <option key={locale} value={locale}>{localeNames[locale]}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="label">{t("status")}</span>
                <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Form["status"] })}>
                  {contentStatuses.map((status) => <option key={status} value={status}>{t(`statuses.${status}`)}</option>)}
                </select>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="label">{t("slug")}</span>
                <input className="input" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </label>
              <label className="block">
                <span className="label">{t("publishDate")}</span>
                <input className="input" type="date" value={form.publishDate} onChange={(e) => setForm({ ...form, publishDate: e.target.value })} />
              </label>
            </div>
            <label className="block">
              <span className="label">{t("titleField")}</span>
              <input className="input" lang={form.locale} required maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label className="block">
              <span className="label">{t("summary")} <span className="font-normal text-ink-muted">({tc("optional")})</span></span>
              <textarea className="input min-h-16" lang={form.locale} maxLength={600} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
            </label>
            <label className="block">
              <span className="label">{t("body")}</span>
              <textarea className="input min-h-56" lang={form.locale} required maxLength={100000} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="label">{t("author")} <span className="font-normal text-ink-muted">({tc("optional")})</span></span>
                <input className="input" maxLength={120} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
              </label>
              <label className="block">
                <span className="label">{t("scriptureRefs")} <span className="font-normal text-ink-muted">({tc("optional")})</span></span>
                <input className="input" value={form.refsText} onChange={(e) => setForm({ ...form, refsText: e.target.value })} placeholder="John 3:16; Psalm 23" />
              </label>
            </div>
            <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-ink">
              <input type="checkbox" className="size-5 accent-accent" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
              {t("featured")}
            </label>
            {error && <p role="alert" className="text-sm text-danger">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" className={buttonClass("ghost", "md")} onClick={() => setForm(null)}>{tc("cancel")}</button>
              <button type="submit" disabled={busy} className={buttonClass("primary", "md")}>{busy ? tc("saving") : tc("save")}</button>
            </div>
          </form>
        )}
      </Sheet>
    </div>
  );
}
