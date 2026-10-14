"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { localeNames, locales, type Locale } from "@cp/shared";
import { useRouter } from "@/i18n/navigation";
import { languageSwitchHref } from "@/i18n/locale-path";

export function LocaleSwitcher({ signedIn = false, className = "" }: { signedIn?: boolean; className?: string }) {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <label className={`relative inline-flex items-center ${className}`}>
      <span className="sr-only">{t("language")}</span>
      <select
        value={locale}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as Locale;
          try { localStorage.setItem("hineni:interface-language", next); } catch { /* next-intl locale cookie remains available. */ }
          if (signedIn) void fetch("/api/v1/me/preferences", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale: next }) }).catch(() => undefined);
          // Read the actual URL at click time, avoiding stale locale/path snapshots.
          const href = languageSwitchHref(window.location.pathname, window.location.search, window.location.hash);
          start(() => router.replace(href, { locale: next }));
        }}
        className="h-10 w-full min-w-26 cursor-pointer appearance-none truncate rounded-xl border border-line bg-surface px-3 text-sm text-ink hover:border-accent"
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {localeNames[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
