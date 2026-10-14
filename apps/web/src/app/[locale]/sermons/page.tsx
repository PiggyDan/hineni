import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@cp/db";
import { localeNames, locales } from "@cp/shared";
import { FilterBar } from "@/components/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { externalLinks, loadPublicData } from "@/lib/public-catalog";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: (await getTranslations({ locale, namespace: "sermons" }))("title") };
}
export default async function SermonsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string; language?: string }> }) {
  const { locale } = await params; const search = await searchParams; const t = await getTranslations({ locale });
  const language = search.language && locales.includes(search.language as (typeof locales)[number]) ? search.language : locale;
  const query = await loadPublicData(() => prisma.sermon.findMany({
    where: {
      published: true,
      locale: language,
      ...(search.q ? { OR: [{ title: { contains: search.q, mode: "insensitive" } }, { description: { contains: search.q, mode: "insensitive" } }, { speaker: { name: { contains: search.q, mode: "insensitive" } } }] } : {}),
    },
    include: { speaker: true },
    orderBy: { date: "desc" },
    take: 24,
  }));
  return <><PageHeader title={t("sermons.title")} subtitle={t("sermons.subtitle")} /><div className="container-page py-12">
    <FilterBar
      languageOptions={locales.map((value) => ({ value, label: localeNames[value] }))}
      currentLanguage={language}
      searchValue={search.q}
      searchPlaceholder={t("common.search")}
    />
    {query.unavailable ? <p role="alert" className="card p-6 text-ink-muted">{t("foundation.serviceUnavailable")}</p> : !query.data?.length ? <p className="card p-6 text-ink-muted">{t("sermons.empty")}</p> : <div className="space-y-5">{query.data.map((sermon) => <article key={sermon.id} className="card p-6">
      <h2 className="text-2xl font-semibold">{sermon.title}</h2>
      {sermon.speaker && <p className="mt-2 text-accent-ink">{sermon.speaker.name}</p>}
      {sermon.date && <p className="mt-2 text-xs text-ink-muted">{sermon.date.toLocaleDateString(locale)}</p>}
      {sermon.description && <p className="mt-4 whitespace-pre-wrap text-ink-muted">{sermon.description}</p>}
      <div className="mt-4 flex flex-wrap gap-3">{externalLinks(sermon.links).map((link) => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-4 py-2 text-sm text-accent-ink hover:border-accent">{link.provider}</a>)}</div>
    </article>)}</div>}
  </div></>;
}
