"use client";

import { ArrowRight, Check, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { buttonClass } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";
import { Link, useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api-client";

export interface PlanDay {
  day: number;
  readings: { label: string; href: string }[];
}

export function PlanTracker({
  slug,
  days,
  signedIn,
  initialCompleted,
}: {
  slug: string;
  days: PlanDay[];
  signedIn: boolean;
  /** null when the reader has not started this plan. */
  initialCompleted: number[] | null;
}) {
  const t = useTranslations("app.plans");
  const tc = useTranslations("app.common");
  const router = useRouter();
  const [completed, setCompleted] = useState<Set<number> | null>(initialCompleted ? new Set(initialCompleted) : null);
  const [pending, start] = useTransition();
  const [error, setError] = useState(false);
  const total = days.length;
  const done = completed?.size ?? 0;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const next = completed ? days.find((day) => !completed.has(day.day)) : days[0];

  const run = (action: () => Promise<void>, refresh = false) =>
    start(async () => {
      setError(false);
      try {
        await action();
        if (refresh) router.refresh();
      } catch {
        setError(true);
      }
    });

  const enroll = () =>
    run(async () => {
      const result = await api<{ completedDays: number[] }>(`/me/plans/${slug}`, { method: "POST" });
      setCompleted(new Set(result.completedDays));
    }, true);
  const leave = () => {
    if (!confirm(t("confirmLeave"))) return;
    run(async () => {
      await api(`/me/plans/${slug}`, { method: "DELETE" });
      setCompleted(null);
    }, true);
  };
  const toggle = (day: number) => {
    if (!completed) return;
    const isDone = completed.has(day);
    const optimistic = new Set(completed);
    if (isDone) optimistic.delete(day);
    else optimistic.add(day);
    setCompleted(optimistic);
    run(async () => {
      try {
        const result = await api<{ completedDays: number[] }>(`/me/plans/${slug}`, { method: "PATCH", body: { day, completed: !isDone } });
        setCompleted(new Set(result.completedDays));
      } catch (cause) {
        setCompleted(completed);
        throw cause;
      }
    });
  };

  return (
    <div>
      <div className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          {completed ? (
            <>
              <p className="flex justify-between gap-3 text-sm">
                <span className="font-medium text-ink">{done === total ? t("completed") : t("dayOf", { day: next?.day ?? total, total })}</span>
                <span className="text-ink-muted">{t("percent", { percent })}</span>
              </p>
              <ProgressBar className="mt-3" value={done} max={total} label={t("percent", { percent })} />
              {done === total && <p className="mt-3 text-sm text-secondary">{t("finished")}</p>}
            </>
          ) : (
            <p className="text-sm text-ink-muted">{signedIn ? t("notStarted") : t("signInToTrack")}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {completed && next?.readings[0] && (
            <Link href={next.readings[0].href} className={buttonClass("primary", "md")}>
              {t("resume", { day: next.day })}
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
            </Link>
          )}
          {!signedIn ? (
            <Link href="/sign-in" className={buttonClass("primary", "md")}>
              {tc("signInCta")}
            </Link>
          ) : completed ? (
            <button type="button" onClick={leave} disabled={pending} className={buttonClass("ghost", "md")}>
              <LogOut className="size-4" aria-hidden />
              {t("leave")}
            </button>
          ) : (
            <button type="button" onClick={enroll} disabled={pending} className={buttonClass("primary", "md")}>
              {t("start")}
            </button>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {tc("error")}
        </p>
      )}

      <ol className="mt-8 divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-surface">
        {days.map((day) => {
          const isDone = completed?.has(day.day) ?? false;
          const isNext = completed && next?.day === day.day;
          return (
            <li key={day.day} id={`day-${day.day}`} className={`flex items-center gap-4 px-4 py-3.5 sm:px-5 ${isNext ? "bg-muted/60" : ""}`}>
              {completed ? (
                <button
                  type="button"
                  onClick={() => toggle(day.day)}
                  aria-pressed={isDone}
                  aria-label={isDone ? t("markUndone", { day: day.day }) : t("markDone", { day: day.day })}
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full border transition ${isDone ? "border-secondary bg-secondary text-white dark:text-bg" : "border-line hover:border-accent"}`}
                >
                  {isDone && <Check className="size-4" aria-hidden />}
                </button>
              ) : (
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-ink-muted">{day.day}</span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold tracking-wider text-ink-muted uppercase">{t("day", { day: day.day })}</p>
                <p className={`mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-[0.95rem] ${isDone ? "text-ink-muted" : "text-ink"}`}>
                  {day.readings.map((reading) => (
                    <Link key={reading.href} href={reading.href} className="underline-offset-4 hover:text-accent-ink hover:underline">
                      {reading.label}
                    </Link>
                  ))}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
