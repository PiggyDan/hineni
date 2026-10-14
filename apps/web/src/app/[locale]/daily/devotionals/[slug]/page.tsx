import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@cp/db";
import { Link } from "@/i18n/navigation";

type Params = Promise<{ locale: string; slug: string }>;

const findDevotional = (locale: string, slug: string) =>
  prisma.content.findFirst({ where: { type: "DEVOTIONAL", locale, slug, status: "PUBLISHED" } }).catch(() => null);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const content = await findDevotional(locale, slug);
  return content ? { title: content.title, description: content.summary ?? undefined } : {};
}

export default async function DevotionalPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("app.devotionals");
  const content = await findDevotional(locale, slug);
  if (!content) notFound();

  return (
    <article className="page-narrow">
      <Link href="/devotionals" className="text-sm text-ink-muted hover:text-ink">
        ← {t("title")}
      </Link>
      <header className="mt-8 animate-rise border-b border-line pb-8">
        {content.publishDate && <p className="text-sm text-ink-muted">{content.publishDate.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}</p>}
        <h1 className="mt-2 font-display text-4xl leading-tight font-semibold text-ink sm:text-5xl">{content.title}</h1>
        {content.summary && <p className="mt-4 text-lg leading-relaxed text-ink-muted">{content.summary}</p>}
        {content.scriptureRefs.length > 0 && <p className="mt-5 text-sm font-medium text-secondary">{content.scriptureRefs.join(" · ")}</p>}
      </header>
      <div className="scripture mt-8 whitespace-pre-line text-ink [--reader-leading:1.8] [--reader-size:1.15rem]">{content.body}</div>
      {content.author && <p className="mt-10 text-sm text-ink-muted">— {content.author}</p>}
    </article>
  );
}
