"use client";

import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { BrandLogo } from "@/components/branding/brand-logo";
import { buttonClass } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import { LocaleSwitcher } from "./locale-switcher";
import { isActive, mainNav, mobileTabs, personalNav } from "./nav-items";
import { Avatar, MusicTrigger, NavList, SignOutButton } from "./shell-parts";
import { adminNav } from "./sidebar";
import { ThemeToggle } from "./theme-toggle";

/** Top bar and full navigation drawer for phones and tablets. */
export function MobileBar({ user, staff }: { user: { name: string } | null; staff: boolean }) {
  const t = useTranslations("app.nav");
  const drawer = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const close = () => drawer.current?.close();

  useEffect(close, [pathname]);

  return (
    <header data-chrome className="glass sticky top-0 z-40 border-x-0 border-t-0 lg:hidden">
      <div className="flex h-14 items-center gap-1 px-3">
        <Link href="/" className="me-auto flex items-center rounded-lg ps-1">
          <BrandLogo variant="symbol" decorative className="w-8 min-[400px]:hidden" />
          <BrandLogo className="hidden w-28 min-[400px]:inline-block" />
        </Link>
        <ThemeToggle />
        <MusicTrigger />
        <button
          type="button"
          className="icon-btn"
          aria-label={t("openMenu")}
          aria-haspopup="dialog"
          onClick={() => drawer.current?.showModal()}
        >
          <Menu className="size-5" aria-hidden />
        </button>
      </div>
      <dialog
        ref={drawer}
        aria-label={t("primary")}
        onClick={(e) => e.target === e.currentTarget && close()}
        className="ms-auto me-0 h-dvh max-h-none w-[min(20rem,88vw)] max-w-none bg-surface p-0 text-ink shadow-2xl open:animate-fade"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <BrandLogo className="w-28" />
            <button type="button" className="icon-btn" aria-label={t("closeMenu")} onClick={close}>
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <nav aria-label={t("primary")} className="flex-1 overflow-y-auto px-3 pb-4">
            <NavList items={mainNav} onNavigate={close} />
            <p className="px-3 pt-6 pb-2 text-[0.68rem] font-semibold tracking-[0.16em] text-ink-muted uppercase">{t("personal")}</p>
            <NavList items={personalNav} onNavigate={close} />
            {staff && (
              <div className="mt-4 border-t border-line pt-4">
                <NavList items={adminNav} onNavigate={close} />
              </div>
            )}
          </nav>
          <div className="space-y-3 border-t border-line p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <LocaleSwitcher signedIn={!!user} className="w-full" />
            {user ? (
              <div className="flex items-center gap-3">
                <Avatar name={user.name} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{user.name}</span>
                <SignOutButton />
              </div>
            ) : (
              <Link href="/sign-in" onClick={close} className={buttonClass("primary", "md", "w-full")}>
                {t("signIn")}
              </Link>
            )}
          </div>
        </div>
      </dialog>
    </header>
  );
}

export function BottomTabs() {
  const t = useTranslations("app.nav");
  const pathname = usePathname();
  return (
    <nav
      data-chrome
      aria-label={t("primary")}
      className="glass fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {mobileTabs.map(({ href, key, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[0.7rem] font-medium transition ${active ? "text-ink" : "text-ink-muted"}`}
          >
            <span className={`flex h-7 w-12 items-center justify-center rounded-full transition ${active ? "bg-muted text-accent-ink" : ""}`}>
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="max-w-full truncate">{t(key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
