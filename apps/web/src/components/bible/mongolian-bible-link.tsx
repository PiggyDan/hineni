import { getTranslations } from "next-intl/server";

/** External reading access, not an enabled/imported HINENI translation. */
export async function MongolianBibleLink({ locale }: { locale: string }) {
  if (locale !== "mn") return null;
  const t = await getTranslations("bible");
  return <a href="https://www.bible.com/versions/369-2004-ariun-bibli-2004" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center rounded-xl border border-line px-4 text-sm text-accent-ink hover:border-accent">{t("readAB2004External")} ↗</a>;
}
