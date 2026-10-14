"use client";

import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { BrandLogo } from "@/components/branding/brand-logo";
import { Link } from "@/i18n/navigation";
import { buttonClass } from "@/components/ui/button";
import { LocaleSwitcher } from "./locale-switcher";
import { mainNav, personalNav, type NavItem } from "./nav-items";
import { Avatar, MusicTrigger, NavList, SignOutButton } from "./shell-parts";
import { ThemeToggle } from "./theme-toggle";

export const adminNav: NavItem[] = [{ href: "/admin", key: "admin", icon: ShieldCheck }];

/** Desktop navigation. Hidden below `lg`, where the top bar and bottom tabs take over. */
export function Sidebar({ user, staff }: { user: { name: string; email: string } | null; staff: boolean }) {
  const t = useTranslations("app.nav");
  return (
    <aside
      data-chrome
      className="fixed inset-y-0 start-0 z-40 hidden w-64 flex-col border-e border-line bg-surface/70 backdrop-blur-xl lg:flex"
    >
      <div className="px-6 pt-7 pb-6">
        <Link href="/" className="inline-block rounded-lg">
          <BrandLogo className="w-36" />
        </Link>
      </div>
      <nav aria-label={t("primary")} className="flex-1 overflow-y-auto px-3 pb-6">
        <NavList items={mainNav} />
        <p className="px-3 pt-7 pb-2 text-[0.68rem] font-semibold tracking-[0.16em] text-ink-muted uppercase">{t("personal")}</p>
        <NavList items={personalNav} />
        {staff && (
          <div className="mt-4 border-t border-line pt-4">
            <NavList items={adminNav} />
          </div>
        )}
      </nav>
      <div className="space-y-3 border-t border-line p-3">
        <div className="flex items-center gap-1">
          <LocaleSwitcher signedIn={!!user} className="flex-1" />
          <ThemeToggle />
          <MusicTrigger />
        </div>
        {user ? (
          <div className="flex items-center gap-2 rounded-xl p-1.5">
            <Link href="/account" className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 hover:bg-muted">
              <Avatar name={user.name} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">{user.name}</span>
                <span className="block truncate text-xs text-ink-muted">{user.email}</span>
              </span>
            </Link>
            <SignOutButton />
          </div>
        ) : (
          <div className="grid gap-2">
            <Link href="/sign-in" className={buttonClass("primary", "md")}>
              {t("signIn")}
            </Link>
            <Link href="/sign-up" className={buttonClass("ghost", "sm")}>
              {t("signUp")}
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
