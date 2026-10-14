"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTransition, useState } from "react";
import { api } from "@/lib/api-client";

export function TranslationSelect({
  value,
  options,
  compact = false,
  signedIn = false,
}: {
  value: string;
  options: { id: string; abbreviation: string; name: string }[];
  compact?: boolean;
  signedIn?: boolean;
}) {
  const t = useTranslations("bible");
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [pending, start] = useTransition();
  const [syncFailed, setSyncFailed] = useState(false);
  return (
    <label className="inline-flex min-w-0 items-center gap-2 text-sm">
      <span className={compact ? "sr-only" : "text-ink-muted"}>{t("translation")}</span>
      <select
        value={value}
        disabled={pending}
        onChange={(event) => {
          const id = event.target.value;
          try { localStorage.setItem("hineni:bible-translation", id); } catch { /* Cookie still persists the device selection. */ }
          document.cookie = `hineni-bible=${encodeURIComponent(id)}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
          setSyncFailed(false);
          if (signedIn) void api("/me/preferences", { method: "PATCH", body: { translationId: id } }).catch(() => setSyncFailed(true));
          const params = new URLSearchParams(search.toString()); params.set("t", id);
          start(() => router.replace(`${pathname}?${params}${window.location.hash}`));
        }}
        className={`min-w-0 cursor-pointer text-ink disabled:opacity-60 ${compact ? "h-10 max-w-28 rounded-full border-0 bg-transparent px-2.5 text-sm font-semibold hover:bg-muted" : "h-11 max-w-full rounded-xl border border-line bg-surface px-3 hover:border-accent"}`}
      >
        {!options.some(option => option.id === value) && <option value={value} disabled>{t("chooseTranslation")}</option>}
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {compact ? o.abbreviation : `${o.abbreviation} — ${o.name}`}
          </option>
        ))}
      </select>
      {syncFailed && <span role="status" className="text-xs text-ink-muted">{t("accountSyncFailed")}</span>}
    </label>
  );
}
