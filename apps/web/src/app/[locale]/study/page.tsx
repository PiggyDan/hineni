import { ArrowRight, Feather } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { Link } from "@/i18n/navigation";
import { contentHref, publishedContent } from "@/lib/content";

export default async function StudyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("study");
  const guides = await publishedContent({ locale, type: "STUDY_GUIDE", take: 8 });

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="container-page py-12">
        <div className="mb-8 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-secondary">
          <Feather className="size-4" aria-hidden />
          {t("guides")}
        </div>

        {guides.length ? (
          <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {guides.map((guide) => (
              <li key={guide.id}>
                <Link href={contentHref(guide)} className="card flex h-full flex-col gap-3 p-6 hover:border-accent">
                  <span className="font-display text-2xl font-semibold text-ink">{guide.title}</span>
                  {guide.summary && <span className="text-sm leading-relaxed text-ink-muted">{guide.summary}</span>}
                  {guide.scriptureRefs.length > 0 && (
                    <span className="text-xs text-ink-muted">{guide.scriptureRefs.join(" • ")}</span>
                  )}
                  <span className="mt-auto inline-flex items-center gap-2 text-sm text-accent-ink">
                    {t("reflect")}
                    <ArrowRight className="size-4" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="card p-8 text-ink-muted">{t("empty")}</p>
        )}
      </div>
    </>
  );
}
