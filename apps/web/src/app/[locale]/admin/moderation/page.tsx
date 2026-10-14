import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@cp/db";
import { AdminAction } from "@/components/admin/admin-controls";
import { staffUser } from "@/lib/admin";

export default async function AdminModeration({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("app.admin");
  const { allowed } = await staffUser(["MODERATOR"]);
  if (!allowed) return <p role="alert" className="text-ink-muted">{t("forbidden")}</p>;
  const [churches, reports] = await Promise.all([
    prisma.church.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, take: 50 }),
    prisma.report.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, take: 50 }),
  ]);

  return (
    <div className="space-y-10">
      <h1 className="page-title">{t("moderation")}</h1>
      <section aria-labelledby="churches-heading">
        <h2 id="churches-heading" className="mb-3 font-semibold text-ink">{t("churches")}</h2>
        {churches.length ? (
          <ul className="space-y-3">
            {churches.map((church) => (
              <li key={church.id} className="card flex flex-wrap items-start gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{church.name}</p>
                  <p className="text-sm text-ink-muted">{[church.address, church.city, church.country].filter(Boolean).join(", ")}</p>
                  {church.website && <p className="mt-1 truncate text-xs text-ink-muted">{church.website}</p>}
                  {church.description && <p className="mt-2 line-clamp-3 text-sm text-ink-muted">{church.description}</p>}
                </div>
                <div className="flex gap-2">
                  <AdminAction path={`/admin/churches/${church.id}`} body={{ status: "APPROVED" }} variant="primary">{t("approve")}</AdminAction>
                  <AdminAction path={`/admin/churches/${church.id}`} body={{ status: "REJECTED" }} variant="danger">{t("reject")}</AdminAction>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="card-soft p-6 text-sm text-ink-muted">{t("nothingPending")}</p>
        )}
      </section>
      <section aria-labelledby="reports-heading">
        <h2 id="reports-heading" className="mb-3 font-semibold text-ink">{t("reports")}</h2>
        {reports.length ? (
          <ul className="space-y-3">
            {reports.map((report) => (
              <li key={report.id} className="card flex flex-wrap items-start gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs text-ink-muted">{report.entityType} · {report.entityId}</p>
                  <p className="mt-1 text-sm text-ink">{report.reason}</p>
                  <p className="mt-1 text-xs text-ink-muted">{report.createdAt.toLocaleString(locale)}</p>
                </div>
                <div className="flex gap-2">
                  <AdminAction path={`/admin/reports/${report.id}`} body={{ status: "APPROVED" }} variant="primary">{t("resolve")}</AdminAction>
                  <AdminAction path={`/admin/reports/${report.id}`} body={{ status: "REJECTED" }}>{t("reject")}</AdminAction>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="card-soft p-6 text-sm text-ink-muted">{t("nothingPending")}</p>
        )}
      </section>
    </div>
  );
}
