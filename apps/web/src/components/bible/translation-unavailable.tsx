import { getTranslations } from "next-intl/server";
import { listTranslations } from "@/lib/bible";
import { TranslationSelect } from "./translation-select";
import { MongolianBibleLink } from "./mongolian-bible-link";

export async function TranslationUnavailable({ locale, requestedId, signedIn = false }: { locale: string; requestedId?: string; signedIn?: boolean }) {
  const t = await getTranslations("bible");
  return <section className="card my-6 space-y-4 p-6" aria-label={t("translation")}><p role="status" className="text-sm text-ink-muted">{t("translationUnavailable")}</p><TranslationSelect signedIn={signedIn} value={requestedId ?? ""} options={await listTranslations()} /><MongolianBibleLink locale={locale} /></section>;
}
