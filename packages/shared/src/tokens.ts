import { branding } from "./branding";

/**
 * Design tokens shared by web (Tailwind CSS variables) and mobile (StyleSheet).
 * Gold and sage are decorative: use `accentText` / `secondary` when those tones
 * must carry text, so contrast stays at WCAG AA (≥ 4.5:1).
 */
export const palette = {
  midnight: branding.colors.navy,
  ivory: branding.colors.ivory,
  gold: branding.colors.gold,
  sage: branding.colors.sage,
  white: branding.colors.white,
  parchment: "#F2EEE5",
  sand: "#E7E1D5",
  slate: "#5A6170",
  goldDeep: "#7D6029",
  goldSoft: "#D2B680",
  sageDeep: "#4F6658",
  sageSoft: "#A9BBAE",
  nightRaised: "#161F31",
  nightMuted: "#1C263A",
  nightBorder: "#263147",
  moon: "#EEEAE2",
  moonMuted: "#A3A9B5",
  danger: "#A23B3B",
  dangerLight: "#E39A9A",
} as const;

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  secondary: string;
  accent: string;
  accentText: string;
  sage: string;
  danger: string;
  highlight: Record<HighlightColor, string>;
}

export type HighlightColor = "gold" | "green" | "blue" | "rose";
export const highlightColors: HighlightColor[] = ["gold", "green", "blue", "rose"];

export const themes: Record<"light" | "dark", ThemeColors> = {
  light: {
    background: palette.ivory,
    surface: palette.white,
    surfaceMuted: palette.parchment,
    border: palette.sand,
    text: palette.midnight,
    textMuted: palette.slate,
    primary: palette.midnight,
    primaryText: palette.white,
    secondary: palette.sageDeep,
    accent: palette.gold,
    accentText: palette.goldDeep,
    sage: palette.sage,
    danger: palette.danger,
    highlight: { gold: "#F3E5C4", green: "#DCE6DE", blue: "#DCE3EF", rose: "#F2DEDC" },
  },
  dark: {
    background: palette.midnight,
    surface: palette.nightRaised,
    surfaceMuted: palette.nightMuted,
    border: palette.nightBorder,
    text: palette.moon,
    textMuted: palette.moonMuted,
    primary: palette.gold,
    primaryText: palette.midnight,
    secondary: palette.sageSoft,
    accent: palette.gold,
    accentText: palette.goldSoft,
    sage: palette.sage,
    danger: palette.dangerLight,
    highlight: { gold: "#4A3D22", green: "#273A31", blue: "#24324D", rose: "#47292D" },
  },
};

export const typography = {
  display: "Noto Serif",
  reading: "Noto Serif",
  ui: "Inter",
  uiMongolian: "Noto Sans",
  hebrew: "Noto Serif Hebrew",
  scale: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, "2xl": 24, "3xl": 30, "4xl": 38, "5xl": 48 },
  readerSizes: [16, 18, 20, 22, 24, 26, 28] as const,
  readerLineHeights: { compact: 1.6, comfortable: 1.85, airy: 2.1 } as const,
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, "2xl": 48, "3xl": 64 } as const;
export const radii = { sm: 8, md: 12, lg: 20, xl: 28, full: 9999 } as const;
