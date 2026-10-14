"use client";

import { LogOut, Music2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { isActive, type NavItem } from "./nav-items";

/** Opens the persistent background-music panel rendered in the locale layout. */
export function MusicTrigger() {
  const t = useTranslations("backgroundMusic");
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("hineni:music-toggle"))}
      className="music-trigger icon-btn"
      aria-label={t("title")}
      title={t("title")}
    >
      <Music2 className="size-4.5" aria-hidden />
    </button>
  );
}

export function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const t = useTranslations("app.nav");
  const pathname = usePathname();
  return (
    <ul className="space-y-0.5">
      {items.map(({ href, key, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className="group flex h-10 items-center gap-3 rounded-xl px-3 text-[0.94rem] text-ink-muted transition hover:bg-muted hover:text-ink aria-[current=page]:bg-muted aria-[current=page]:font-medium aria-[current=page]:text-ink"
            >
              <Icon
                className={`size-4.5 shrink-0 transition ${active ? "text-accent-ink" : "text-ink-muted group-hover:text-ink"}`}
                aria-hidden
              />
              {t(key)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function Avatar({ name, className = "size-8 text-sm" }: { name: string; className?: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "•";
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-primary font-display font-semibold text-on-primary ${className}`}
    >
      {initial}
    </span>
  );
}

export function SignOutButton({ className = "icon-btn", withLabel = false }: { className?: string; withLabel?: boolean }) {
  const t = useTranslations("app.nav");
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      aria-label={withLabel ? undefined : t("signOut")}
      title={t("signOut")}
      onClick={async () => {
        await authClient.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      <LogOut className="size-4.5" aria-hidden />
      {withLabel && t("signOut")}
    </button>
  );
}
