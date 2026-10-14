"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const order = ["light", "dark", "system"] as const;

export function ThemeToggle() {
  const t = useTranslations("common");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard next-themes hydration guard
  useEffect(() => setMounted(true), []);

  const current = (mounted ? theme : "system") as (typeof order)[number];
  const next = order[(order.indexOf(current) + 1) % order.length]!;
  const Icon = current === "light" ? Sun : current === "dark" ? Moon : Monitor;
  const label = { light: t("themeLight"), dark: t("themeDark"), system: t("themeSystem") }[current];

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="icon-btn"
      aria-label={`${t("theme")}: ${label}`}
      title={`${t("theme")}: ${label}`}
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
}
