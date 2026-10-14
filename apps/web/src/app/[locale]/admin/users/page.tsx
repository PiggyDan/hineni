import { Search } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@cp/db";
import { RoleSelect } from "@/components/admin/admin-controls";
import { staffUser } from "@/lib/admin";

export default async function AdminUsers({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("app.admin");
  const { user, allowed } = await staffUser(["ADMIN"]);
  if (!allowed || !user) return <p role="alert" className="text-ink-muted">{t("forbidden")}</p>;
  const q = (await searchParams).q?.trim().slice(0, 254);
  const users = await prisma.user.findMany({
    where: q ? { email: { contains: q, mode: "insensitive" } } : {},
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, name: true, email: true, role: true, createdAt: true, emailVerified: true },
  });

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="page-title">{t("users")}</h1>
        <form role="search" className="relative sm:w-72">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
          <input name="q" type="search" defaultValue={q} placeholder={t("searchUsers")} aria-label={t("searchUsers")} className="input h-10 rounded-full ps-9" />
        </form>
      </div>
      {users.length ? (
        <ul className="divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-surface">
          {users.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{item.name}</p>
                <p className="truncate text-xs text-ink-muted">
                  {item.email} · {t("joined")} {item.createdAt.toLocaleDateString(locale)}
                </p>
              </div>
              <RoleSelect userId={item.id} role={item.role} disabled={item.id === user.id} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="card-soft p-8 text-center text-ink-muted">{t("noUsers")}</p>
      )}
    </div>
  );
}
