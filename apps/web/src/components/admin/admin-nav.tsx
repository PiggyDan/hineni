"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export function AdminNav({ items }: { items: { href: string; key: string }[] }) {
  const t = useTranslations("app.admin");
  const pathname = usePathname();
  return (
    <nav aria-label={t("title")} className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {items.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className="chip shrink-0">
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}
