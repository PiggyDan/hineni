import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminNav } from "@/components/admin/admin-nav";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser, hasRole } from "@/lib/session";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Staff-only area. Each page and every admin API route also checks its own required role. */
export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: "/sign-in", locale });
    return null;
  }
  const t = await getTranslations("app.admin");
  if (!hasRole(user, ["EDITOR", "MODERATOR"])) {
    return (
      <div className="page-narrow">
        <p role="alert" className="card-soft p-8 text-center text-ink-muted">{t("forbidden")}</p>
      </div>
    );
  }
  const items = [
    { href: "/admin", key: "overview", show: true },
    { href: "/admin/editions", key: "editions", show: hasRole(user, "ADMIN") },
    { href: "/admin/plans", key: "plans", show: hasRole(user, "EDITOR") },
    { href: "/admin/content", key: "content", show: hasRole(user, "EDITOR") },
    { href: "/admin/moderation", key: "moderation", show: hasRole(user, "MODERATOR") },
    { href: "/admin/users", key: "users", show: hasRole(user, "ADMIN") },
  ].filter((item) => item.show);

  return (
    <div className="page">
      <header className="mb-6">
        <p className="eyebrow flex items-center gap-1.5">
          <ShieldCheck className="size-3.5" aria-hidden />
          {t("title")}
        </p>
      </header>
      <AdminNav items={items} />
      <div className="mt-8">{children}</div>
    </div>
  );
}
