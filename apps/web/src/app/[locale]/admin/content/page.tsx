import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale } from "@cp/shared";
import { prisma } from "@cp/db";
import { ContentEditor } from "@/components/admin/content-editor";
import { staffUser } from "@/lib/admin";

export default async function AdminContent({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("app.admin");
  const { allowed } = await staffUser(["EDITOR"]);
  if (!allowed) return <p role="alert" className="text-ink-muted">{t("forbidden")}</p>;
  const items = await prisma.content.findMany({ orderBy: { updatedAt: "desc" }, take: 200 });

  return (
    <div>
      <h1 className="page-title mb-6">{t("content")}</h1>
      <ContentEditor
        defaultLocale={isLocale(locale) ? locale : "en"}
        items={items.map((item) => ({
          id: item.id,
          type: item.type,
          slug: item.slug,
          locale: isLocale(item.locale) ? item.locale : "en",
          title: item.title,
          summary: item.summary ?? "",
          body: item.body,
          author: item.author ?? "",
          scriptureRefs: item.scriptureRefs,
          publishDate: item.publishDate ? item.publishDate.toISOString().slice(0, 10) : "",
          featured: item.featured,
          status: item.status,
          updatedAt: item.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
