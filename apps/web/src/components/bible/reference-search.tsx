"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { parseReference, type EditionMetadata } from "@cp/shared";
import { useRouter } from "@/i18n/navigation";

export function ReferenceSearch({ translationId, metadata, className = "" }: { translationId?: string; metadata?: EditionMetadata; className?: string }) {
  const t = useTranslations("bible");
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  return (
    <form
      role="search"
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const p = parseReference(value, metadata);
        if (!p) return setError(true);
        setError(false);
        const qs = translationId ? `?t=${translationId}` : "";
        const hash = p.verseStart ? `#v${p.verseStart}` : "";
        router.push(`/bible/${p.bookId.toLowerCase()}/${p.chapter}${qs}${hash}`);
      }}
    >
      <label className="relative block">
        <span className="sr-only">{t("searchPlaceholder")}</span>
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-invalid={error}
          aria-describedby={error ? "ref-error" : undefined}
          className="input h-11 rounded-full pl-10"
        />
      </label>
      {error && (
        <p id="ref-error" role="alert" className="mt-2 text-sm text-danger">
          {t("invalidReference")}
        </p>
      )}
    </form>
  );
}
