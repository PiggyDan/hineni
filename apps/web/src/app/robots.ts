import type { MetadataRoute } from "next";
import { locales } from "@cp/shared";
export default function robots(): MetadataRoute.Robots {
  const privatePaths = ["account", "library", "prayer", "upload", "admin", "sign-in", "sign-up", "forgot-password", "reset-password"];
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", ...locales.flatMap((locale) => privatePaths.map((path) => `/${locale}/${path}`))] }, sitemap: `${process.env.APP_URL || "http://localhost:3000"}/sitemap.xml` };
}
