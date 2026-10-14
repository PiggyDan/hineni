"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api-client";

interface Option {
  id: string;
  name: string;
  abbreviation: string;
  languageLabel: string;
}

/** Saves the Scripture edition independently of the interface language. */
export function TranslationSetting({ value, options, signedIn }: { value: string; options: Option[]; signedIn: boolean }) {
  const t = useTranslations("app.settings");
  const tb = useTranslations("bible");
  const router = useRouter();
  const [selected, setSelected] = useState(value);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const groups = [...new Set(options.map((o) => o.languageLabel))];

  return (
    <div>
      <select
        className="input"
        value={selected}
        disabled={pending}
        aria-label={t("bible")}
        onChange={(event) => {
          const id = event.target.value;
          setSelected(id);
          try {
            localStorage.setItem("hineni:bible-translation", id);
          } catch {
            /* the cookie below still persists the choice */
          }
          document.cookie = `hineni-bible=${encodeURIComponent(id)}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
          start(async () => {
            if (signedIn) {
              try {
                await api("/me/preferences", { method: "PATCH", body: { translationId: id } });
                setStatus(t("synced"));
              } catch {
                setStatus(tb("accountSyncFailed"));
              }
            } else setStatus(t("device"));
            router.refresh();
          });
        }}
      >
        {!options.some((o) => o.id === selected) && (
          <option value={selected} disabled>
            {tb("chooseTranslation")}
          </option>
        )}
        {groups.map((group) => (
          <optgroup key={group} label={group}>
            {options
              .filter((o) => o.languageLabel === group)
              .map((o) => (
                <option key={o.id} value={o.id}>
                  {o.abbreviation} — {o.name}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
      <p role="status" aria-live="polite" className="mt-2 min-h-5 text-xs text-ink-muted">
        {status}
      </p>
    </div>
  );
}
