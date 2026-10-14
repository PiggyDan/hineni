import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@cp/db";
import { localeNames, locales } from "@cp/shared";
import { FilterBar } from "@/components/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { externalLinks, loadPublicData } from "@/lib/public-catalog";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: (await getTranslations({ locale, namespace: "music" }))("title") };
}
export default async function MusicPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string; language?: string }> }) {
  const { locale } = await params; const search = await searchParams; const t = await getTranslations({ locale });
  const language = search.language && locales.includes(search.language as (typeof locales)[number]) ? search.language : locale;
  const { data: tracks, unavailable } = await loadPublicData(() => prisma.track.findMany({
    where: {
      published: true,
      artist: { published: true },
      ...(search.q ? { OR: [{ title: { contains: search.q, mode: "insensitive" } }, { artist: { name: { contains: search.q, mode: "insensitive" } } }] } : {}),
    },
    include: { artist: true },
    orderBy: { createdAt: "desc" },
    take: 24,
  }));
  return <><PageHeader title={t("music.title")} subtitle={t("music.subtitle")} /><div className="container-page py-12">
    <FilterBar
      languageOptions={locales.map((value) => ({ value, label: localeNames[value] }))}
      currentLanguage={language}
      searchValue={search.q}
      searchPlaceholder={t("common.search")}
    />
    {unavailable ? <p role="alert" className="card p-6 text-ink-muted">{t("foundation.serviceUnavailable")}</p> : !tracks?.length ? <p className="card p-6 text-ink-muted">{t("music.empty")}</p> : <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{tracks.map((track) => <li key={track.id} className="card p-6">
      <h2 className="text-2xl font-semibold">{track.title}</h2><p className="mt-2 text-sm text-ink-muted">{track.artist.name}</p>
      <div className="mt-5 flex flex-wrap gap-3">{externalLinks(track.links).map((link) => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-4 py-2 text-sm text-accent-ink hover:border-accent">{t("music.listenOn", { provider: link.provider })}</a>)}</div>
    </li>)}</ul>}
  </div></>;
}
