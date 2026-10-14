import { getLocale, getTranslations } from "next-intl/server";
import { brandTagline, branding } from "@cp/shared";

export async function SiteFooter() {
  const [t, locale] = await Promise.all([getTranslations("footer"), getLocale()]);
  return (
    <footer data-chrome className="mt-16 border-t border-line">
      <div className="container-page flex flex-col gap-3 py-8 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-semibold tracking-[0.14em] text-ink">{branding.shortName}</span>
          <span lang="he" dir="rtl" className="mx-2 font-reading text-sm text-accent-ink">
            {branding.hebrewName}
          </span>
          <span>{brandTagline(locale)}</span>
        </p>
        <p className="max-w-xl sm:text-end">{t("copyright")}</p>
        <p className="shrink-0">© 2026 Powered by Daniel Knight</p>
      </div>
    </footer>
  );
}
