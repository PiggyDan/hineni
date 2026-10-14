import { ArrowRight, Church, Feather, Headphones, Music } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@cp/db";
import { PageHeader } from "@/components/ui/page-header";
import { Link } from "@/i18n/navigation";
import { backgroundHymns } from "@/lib/hymns";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: (await getTranslations({ locale, namespace: "app.community" }))("title") };
}

/** Hub for the existing community directories. Counts are live published records only. */
export default async function CommunityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("app.community");
  const [churches, sermons, tracks, studies] = await Promise.all([
    prisma.church.count({ where: { status: "APPROVED" } }).catch(() => 0),
    prisma.sermon.count({ where: { published: true } }).catch(() => 0),
    prisma.track.count({ where: { published: true } }).catch(() => 0),
    prisma.content.count({ where: { status: "PUBLISHED", locale, type: { in: ["STUDY_GUIDE", "ARTICLE", "TOPIC"] } } }).catch(() => 0),
  ]);
  const items = [
    { href: "/churches", icon: Church, title: t("churches"), body: t("churchesBody"), count: churches },
    { href: "/sermons", icon: Headphones, title: t("sermons"), body: t("sermonsBody"), count: sermons },
    { href: "/music", icon: Music, title: t("music"), body: t("musicBody"), count: tracks + backgroundHymns.length },
    { href: "/study", icon: Feather, title: t("study"), body: t("studyBody"), count: studies },
  ];

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="container-page pt-8">
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map(({ href, icon: Icon, title, body, count }) => (
            <li key={href}>
              <Link href={href} className="card group flex h-full items-start gap-4 p-6 transition hover:-translate-y-0.5 hover:border-accent">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-accent-ink">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-xl font-semibold text-ink">{title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-ink-muted">{body}</span>
                  <span className="mt-3 block text-xs font-medium text-secondary">{t("published", { count })}</span>
                </span>
                <ArrowRight className="mt-1 size-4 text-ink-muted transition group-hover:translate-x-0.5 rtl:rotate-180" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
