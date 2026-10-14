"use client";

import { Pencil, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { formatReference, parseReference, type Passage } from "@cp/shared";
import { buttonClass } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { useRouter } from "@/i18n/navigation";
import { api, ApiClientError } from "@/lib/api-client";

export interface AdminPlan {
  id: string;
  slug: string;
  kind: "CANONICAL" | "THEMATIC";
  titleEn: string;
  titleMn: string;
  descriptionEn: string;
  descriptionMn: string;
  days: Passage[][];
  published: boolean;
  enrollments: number;
}

type Form = Omit<AdminPlan, "id" | "days" | "enrollments"> & { id?: string; daysText: string };

const empty: Form = { slug: "", kind: "THEMATIC", titleEn: "", titleMn: "", descriptionEn: "", descriptionMn: "", published: false, daysText: "" };
// Stored in English so any editor can round-trip the text; the parser also accepts Mongolian book names.
const toText = (days: Passage[][]) => days.map((day) => day.map((p) => formatReference(p, "en")).join("; ")).join("\n");

export function PlanEditor({ plans }: { plans: AdminPlan[] }) {
  const t = useTranslations("app.admin");
  const tp = useTranslations("app.plans");
  const tc = useTranslations("app.common");
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    const lines = form.daysText.split("\n").map((line) => line.trim()).filter(Boolean);
    const days: Passage[][] = [];
    for (const [index, line] of lines.entries()) {
      const day: Passage[] = [];
      for (const ref of line.split(";").map((part) => part.trim()).filter(Boolean)) {
        const passage = parseReference(ref);
        if (!passage) return setError(t("invalidDay", { line: index + 1, ref }));
        day.push(passage);
      }
      days.push(day);
    }
    if (!days.length) return setError(t("daysHint"));
    setError(null);
    setBusy(true);
    const { id, daysText: _daysText, ...fields } = form;
    void _daysText;
    try {
      await api(id ? `/admin/plans/${id}` : "/admin/plans", { method: id ? "PATCH" : "POST", body: { ...fields, days } });
      setForm(null);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof ApiClientError && cause.code === "slug_taken" ? t("slugTaken") : tc("error"));
    } finally {
      setBusy(false);
    }
  }

  const field = (key: keyof Form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) =>
    form && (
      <label className="block">
        <span className="label">{label}</span>
        <input className="input" value={String(form[key] ?? "")} onChange={(e) => setForm({ ...form, [key]: e.target.value })} {...props} />
      </label>
    );

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button type="button" className={buttonClass("primary", "md")} onClick={() => { setError(null); setForm(empty); }}>
          <Plus className="size-4" aria-hidden />
          {t("newPlan")}
        </button>
      </div>
      <ul className="divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-surface">
        {plans.map((plan) => (
          <li key={plan.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink">{plan.titleEn}</p>
              <p className="text-xs text-ink-muted">
                /{plan.slug} · {tp("length", { count: plan.days.length })} · {t("enrollments", { count: plan.enrollments })}
              </p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${plan.published ? "bg-secondary/15 text-secondary" : "bg-muted text-ink-muted"}`}>
              {plan.published ? t("published") : t("draft")}
            </span>
            <button
              type="button"
              className="icon-btn size-9"
              aria-label={`${t("editPlan")}: ${plan.titleEn}`}
              onClick={() => {
                setError(null);
                setForm({ id: plan.id, slug: plan.slug, kind: plan.kind, titleEn: plan.titleEn, titleMn: plan.titleMn, descriptionEn: plan.descriptionEn, descriptionMn: plan.descriptionMn, published: plan.published, daysText: toText(plan.days) });
              }}
            >
              <Pencil className="size-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>

      <Sheet open={!!form} onClose={() => setForm(null)} title={form?.id ? t("editPlan") : t("newPlan")}>
        {form && (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {field("slug", t("slug"), { required: true, pattern: "[a-z0-9]+(-[a-z0-9]+)*", maxLength: 120 })}
              <label className="block">
                <span className="label">{t("kind")}</span>
                <select className="input" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as Form["kind"] })}>
                  <option value="THEMATIC">{tp("thematic")}</option>
                  <option value="CANONICAL">{tp("canonical")}</option>
                </select>
              </label>
              {field("titleEn", t("titleEn"), { required: true, maxLength: 160 })}
              {field("titleMn", t("titleMn"), { required: true, maxLength: 160, lang: "mn" })}
            </div>
            <label className="block">
              <span className="label">{t("descriptionEn")}</span>
              <textarea className="input min-h-20" maxLength={2000} value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} />
            </label>
            <label className="block">
              <span className="label">{t("descriptionMn")}</span>
              <textarea lang="mn" className="input min-h-20" maxLength={2000} value={form.descriptionMn} onChange={(e) => setForm({ ...form, descriptionMn: e.target.value })} />
            </label>
            <label className="block">
              <span className="label">{t("days")}</span>
              <textarea className="input min-h-40 font-mono text-sm" required value={form.daysText} onChange={(e) => setForm({ ...form, daysText: e.target.value })} aria-describedby="days-hint" />
              <span id="days-hint" className="mt-1.5 block text-xs text-ink-muted">{t("daysHint")}</span>
            </label>
            <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-ink">
              <input type="checkbox" className="size-5 accent-accent" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
              {t("published")}
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
