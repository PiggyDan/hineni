import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@cp/db";
import { staffUser } from "@/lib/admin";

export default async function AdminOverview({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("app.admin");
  const { allowed } = await staffUser(["EDITOR", "MODERATOR"]);
  if (!allowed) return null;
  const [users, plans, content, pendingChurches, pendingReports, audit] = await Promise.all([
    prisma.user.count(),
    prisma.readingPlan.count({ where: { published: true } }),
    prisma.content.count({ where: { status: "PUBLISHED" } }),
    prisma.church.count({ where: { status: "PENDING" } }),
    prisma.report.count({ where: { status: "PENDING" } }),
    // Audit metadata never contains private content (see lib/audit.ts).
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 15, select: { id: true, action: true, entityType: true, createdAt: true } }),
  ]);
  const stats = [
    { label: t("users_count"), value: users },
    { label: t("plans_count"), value: plans },
    { label: t("content_count"), value: content },
    { label: t("pending_count"), value: pendingChurches + pendingReports },
  ];

  return (
    <div className="space-y-10">
      <h1 className="page-title">{t("overview")}</h1>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <li key={stat.label} className="card p-5">
            <span className="block font-display text-3xl font-semibold text-ink tabular-nums">{stat.value}</span>
            <span className="mt-1 block text-sm text-ink-muted">{stat.label}</span>
          </li>
        ))}
      </ul>
      <section aria-labelledby="audit-heading">
        <h2 id="audit-heading" className="mb-3 font-semibold text-ink">{t("audit")}</h2>
        <ul className="divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-surface text-sm">
          {audit.map((entry) => (
            <li key={entry.id} className="flex justify-between gap-4 px-5 py-3">
              <span className="font-mono text-xs text-ink">{entry.action}</span>
              <span className="text-xs text-ink-muted">{entry.entityType} · {entry.createdAt.toLocaleString(locale)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
