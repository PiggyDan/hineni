import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@cp/db";
import { Link } from "@/i18n/navigation";
import { externalLinks, loadPublicData } from "@/lib/public-catalog";
type Params = Promise<{ locale: string; slug: string }>;
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await loadPublicData(() => prisma.church.findFirst({ where: { slug, status: "APPROVED" }, select: { name: true, description: true } }));
  return data ? { title: data.name, description: data.description ?? undefined } : {};
}
export default async function ChurchDetailPage({ params }: { params: Params }) {
  const { locale, slug } = await params; const t = await getTranslations({ locale });
  const { data: church, unavailable } = await loadPublicData(() => prisma.church.findFirst({ where: { slug, status: "APPROVED" } }));
  if (unavailable) return <div className="container-page py-12"><p role="alert" className="card p-6">{t("foundation.serviceUnavailable")}</p></div>;
  if (!church) notFound();
  const map = `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${church.address} ${church.city} ${church.country}`)}`;
  const website = externalLinks([{ url: church.website, provider: "website" }])[0];
  return <div className="container-page py-12"><Link href="/churches" className="text-accent-ink">{t("common.back")}</Link><article className="card mt-6 p-6 sm:p-10">
    {church.verified && <p className="eyebrow">{t("churches.verified")}</p>}
    <h1 className="mt-2 text-4xl font-semibold">{church.name}</h1><p className="mt-3 text-ink-muted">{church.city}, {church.country}</p>
    {church.description && <p className="mt-6 whitespace-pre-wrap">{church.description}</p>}
    <dl className="mt-8 grid gap-5 sm:grid-cols-3"><div><dt className="eyebrow">{t("churches.fields.address")}</dt><dd className="mt-2">{church.address}</dd></div>{church.serviceTimes && <div><dt className="eyebrow">{t("churches.services")}</dt><dd className="mt-2">{church.serviceTimes}</dd></div>}<div><dt className="eyebrow">{t("common.language")}</dt><dd className="mt-2">{church.languages.join(", ")}</dd></div></dl>
    <div className="mt-8 flex flex-wrap gap-4"><a className="rounded-full border border-line px-4 py-2 text-accent-ink" href={map} target="_blank" rel="noopener noreferrer">{t("churches.map")}</a>{website && <a className="rounded-full border border-line px-4 py-2 text-accent-ink" href={website.url} target="_blank" rel="noopener noreferrer">{t("churches.website")}</a>}</div>
  </article></div>;
}
