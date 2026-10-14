import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { Link } from "@/i18n/navigation";
import { contentHref, publishedContent } from "@/lib/content";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: (await getTranslations({ locale, namespace: "app.devotionals" }))("title") };
}

export default async function DevotionalsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("app.devotionals");
  const [first, ...rest] = await publishedContent({ locale, type: "DEVOTIONAL", take: 60, releasedOnly: true });

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="container-page pt-8">
        {!first ? (
          <EmptyState>{t("empty")}</EmptyState>
        ) : (
          <>
            <Link href={contentHref(first)} className="card group block p-7 transition hover:border-accent sm:p-10">
              {first.publishDate && <p className="text-sm text-ink-muted">{first.publishDate.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}</p>}
              <h2 className="mt-2 font-display text-3xl font-semibold text-ink">{first.title}</h2>
              {first.summary && <p className="mt-3 max-w-2xl leading-relaxed text-ink-muted">{first.summary}</p>}
              {first.scriptureRefs.length > 0 && <p className="mt-4 text-sm text-secondary">{first.scriptureRefs.join(" · ")}</p>}
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent-ink">
                {t("read")}
                <ArrowRight className="size-4 transition group-hover:translate-x-0.5 rtl:rotate-180" aria-hidden />
              </span>
            </Link>
            {rest.length > 0 && (
              <ul className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((item) => (
                  <li key={item.id}>
                    <Link href={contentHref(item)} className="card flex h-full flex-col gap-2 p-6 transition hover:border-accent">
                      {item.publishDate && <span className="text-xs text-ink-muted">{item.publishDate.toLocaleDateString(locale, { month: "short", day: "numeric" })}</span>}
                      <span className="font-display text-lg font-semibold text-ink">{item.title}</span>
                      {item.summary && <span className="line-clamp-3 text-sm text-ink-muted">{item.summary}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </>
  );
}
