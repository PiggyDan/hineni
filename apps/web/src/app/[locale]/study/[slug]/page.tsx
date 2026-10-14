import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@cp/db";
import { PageHeader } from "@/components/ui/page-header";

export default async function StudyGuidePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("study");

  const content = await prisma.content.findFirst({
    where: {
      type: "STUDY_GUIDE",
      locale,
      slug,
      status: "PUBLISHED",
    },
  });

  if (!content) notFound();

  return (
    <>
      <PageHeader title={content.title} subtitle={content.summary ?? t("subtitle")} />
      <div className="container-page py-12">
        <article className="card mx-auto max-w-3xl p-6 sm:p-8">
          {content.scriptureRefs.length > 0 && (
            <p className="mb-6 rounded-full border border-line bg-muted px-3 py-2 text-sm text-ink-muted">
              {content.scriptureRefs.join(" • ")}
            </p>
          )}
          <div className="whitespace-pre-line text-lg leading-relaxed text-ink">{content.body}</div>
          {content.author && <p className="mt-8 text-sm text-ink-muted">— {content.author}</p>}
        </article>
      </div>
    </>
  );
}
