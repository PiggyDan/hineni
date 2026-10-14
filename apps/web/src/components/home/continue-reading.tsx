"use client";

import { ArrowRight, BookOpen } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { Link } from "@/i18n/navigation";
import { readLastLocation, type LastLocation } from "@/lib/last-location";

const subscribe = () => () => undefined;

/**
 * Signed-in readers get their server-side history; anyone else gets the last chapter
 * stored on this device by the Bible reader.
 */
export function ContinueReading({ last, bookNames }: { last: LastLocation | null; bookNames: Record<string, string> }) {
  const t = useTranslations("app.home");
  const locale = useLocale();
  const local = useSyncExternalStore(subscribe, readLastLocation, () => null);
  const place = last ?? local;
  const href = place ? `/bible/${place.bookId.toLowerCase()}/${place.chapter}?t=${encodeURIComponent(place.translationId)}` : "/bible/jhn/1";

  return (
    <Link href={href} className="card group flex h-full flex-col gap-4 p-6 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-lg hover:shadow-black/5">
      <span className="flex items-center justify-between">
        <span className="eyebrow">{place ? t("continueReading") : t("startReading")}</span>
        <span className="flex size-9 items-center justify-center rounded-full bg-muted text-accent-ink">
          <BookOpen className="size-4" aria-hidden />
        </span>
      </span>
      {place ? (
        <span>
          <span className="block font-display text-2xl font-semibold text-ink">
            {bookNames[place.bookId] ?? place.bookId} {place.chapter}
          </span>
          <span className="mt-1 block text-sm text-ink-muted">
            {place.translationId.toUpperCase()} · {t("lastOpened", { date: new Date(place.at).toLocaleDateString(locale, { month: "short", day: "numeric" }) })}
          </span>
        </span>
      ) : (
        <span className="text-sm leading-relaxed text-ink-muted">{t("continueEmpty")}</span>
      )}
      <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-accent-ink">
        {place ? t("continueReading") : t("startReading")}
        <ArrowRight className="size-4 transition group-hover:translate-x-0.5 rtl:rotate-180" aria-hidden />
      </span>
    </Link>
  );
}
