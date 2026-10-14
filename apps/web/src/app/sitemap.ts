import type { MetadataRoute } from "next";
import { locales } from "@cp/shared";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_URL || "http://localhost:3000";
  return locales.flatMap((locale) => ["", "/bible", "/daily", "/study", "/music", "/sermons", "/churches"].map((path) => ({ url: `${base}/${locale}${path}`, alternates: { languages: Object.fromEntries(locales.map((language) => [language, `${base}/${language}${path}`])) } })));
}
