import { themes, type ThemeColors } from "@cp/shared";

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

function vars(t: ThemeColors): string {
  const { highlight, ...rest } = t;
  const entries = [
    ...Object.entries(rest).map(([k, v]) => `--c-${kebab(k)}:${v}`),
    ...Object.entries(highlight).map(([k, v]) => `--c-hl-${k}:${v}`),
  ];
  return entries.join(";");
}

/** CSS variables generated from the shared design tokens (single source of truth). */
export const themeCss = `:root{${vars(themes.light)};color-scheme:light}.dark{${vars(themes.dark)};color-scheme:dark}`;
