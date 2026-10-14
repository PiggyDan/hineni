/**
 * Central HINENI branding configuration:
 * change it here (or via NEXT_PUBLIC_BRAND_* / EXPO_PUBLIC_BRAND_* env vars) and
 * every app — web, admin, mobile, emails — picks it up.
 */
export interface Branding {
  name: { en: string; mn: string; he: string };
  descriptiveName: string;
  hebrewName: string;
  meaning: string;
  tagline: { en: string; mn: string; he: string };
  scriptureReferences: string[];
  shortName: string;
  supportEmail: string;
  domain: string;
  /** Unicode glyph used as a text logo until a real mark exists. */
  logoGlyph: string;
  /** Deep-link scheme for the mobile apps (also trusted by the auth server). */
  appScheme: string;
  /** Reverse-DNS app identifier for iOS/Android stores. */
  appId: string;
  iconPath: string;
  legacyAppSchemes: string[];
  colors: { navy: string; gold: string; ivory: string; white: string; sage: string };
  assets: Record<"horizontal" | "vertical" | "symbol", { light: string; dark: string }>;
  appIconPath: string;
  socialImagePath: string;
}

// Static `process.env.X` access is required so Next.js and Expo can inline values at build time.
declare const process: { env: Record<string, string | undefined> };

export const branding: Branding = {
  name: {
    en: process.env.NEXT_PUBLIC_BRAND_NAME || process.env.EXPO_PUBLIC_BRAND_NAME || "HINENI",
    mn: process.env.NEXT_PUBLIC_BRAND_NAME_MN || process.env.EXPO_PUBLIC_BRAND_NAME_MN || "HINENI",
    he: process.env.NEXT_PUBLIC_BRAND_NAME_HE || process.env.EXPO_PUBLIC_BRAND_NAME_HE || "הִנֵּנִי",
  },
  descriptiveName: "HINENI Bible",
  hebrewName: "הִנֵּנִי",
  meaning: "Here I Am",
  tagline: {
    en: "Here I Am.",
    mn: "Би энд байна.",
    he: "הִנֵּנִי",
  },
  scriptureReferences: ["Genesis 22:1", "Exodus 3:4", "1 Samuel 3:4"],
  shortName: "HINENI",
  supportEmail: "",
  domain: "",
  logoGlyph: "H",
  appScheme: "hineni",
  legacyAppSchemes: ["ruah", "selah"],
  appId: "org.hineni",
  iconPath: "/branding/hineni-favicon.svg",
  colors: { navy: "#101827", gold: "#C5A46D", ivory: "#FAF8F3", white: "#FFFFFF", sage: "#829688" },
  assets: {
    horizontal: { light: "/branding/hineni-logo-light.svg", dark: "/branding/hineni-logo-dark.svg" },
    vertical: { light: "/branding/hineni-logo-vertical-light.svg", dark: "/branding/hineni-logo-vertical.svg" },
    symbol: { light: "/branding/hineni-symbol-light.svg", dark: "/branding/hineni-symbol.svg" },
  },
  appIconPath: "/branding/hineni-app-icon.png",
  socialImagePath: "/branding/hineni-og.png",
};

export const brandName = (locale: string): string => {
  if (locale === "mn") return branding.name.mn;
  if (locale === "he") return branding.name.he;
  return branding.name.en;
};

export const brandTagline = (locale: string): string => {
  if (locale === "mn") return branding.tagline.mn;
  if (locale === "he") return branding.tagline.he;
  return branding.tagline.en;
};
