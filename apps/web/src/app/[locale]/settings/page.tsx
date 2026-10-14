import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ReaderPreferenceControls } from "@/components/bible/reader-settings";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { TranslationSetting } from "@/components/settings/translation-setting";
import { PageHeader } from "@/components/ui/page-header";
import { Link } from "@/i18n/navigation";
import { listTranslations } from "@/lib/bible";
import { readerContext } from "@/lib/reader";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: (await getTranslations({ locale, namespace: "app.settings" }))("title"), robots: { index: false, follow: false } };
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="card grid gap-5 p-6 md:grid-cols-[14rem_1fr] md:gap-8">
      <div>
        <h2 className="font-semibold text-ink">{title}</h2>
        {hint && <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{hint}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("app.settings");
  const { user, translation, requestedId } = await readerContext(locale);
  const translations = await listTranslations().catch(() => []);
  const languageName = new Intl.DisplayNames([locale], { type: "language" });
  const languageLabel = (code: string) => {
    try {
      return languageName.of(code) ?? code;
    } catch {
      return code;
    }
  };

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="container-page space-y-5 pt-8">
        <Section title={t("language")} hint={t("languageHint")}>
          <LocaleSwitcher signedIn={!!user} className="w-full sm:w-72" />
        </Section>
        <Section title={t("bible")} hint={t("bibleHint")}>
          <TranslationSetting
            signedIn={!!user}
            value={translation?.id ?? requestedId ?? ""}
            options={translations.map((item) => ({ id: item.id, name: item.name, abbreviation: item.abbreviation, languageLabel: languageLabel(item.language) }))}
          />
        </Section>
        <Section title={t("reading")}>
          <ReaderPreferenceControls signedIn={!!user} showPreview />
        </Section>
        {user && (
          <Section title={t("account")}>
            <Link href="/account" className="inline-flex items-center gap-2 font-medium text-accent-ink hover:underline">
              {t("profileLink")}
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
            </Link>
          </Section>
        )}
      </div>
    </>
  );
}
