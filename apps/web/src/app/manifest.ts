import type { MetadataRoute } from "next";
import { branding } from "@cp/shared";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/", name: branding.descriptiveName, short_name: branding.shortName,
    description: `${branding.hebrewName} — ${branding.tagline.en}`,
    // "/" lets the locale proxy choose the reader's saved interface language.
    start_url: "/", scope: "/", lang: "en",
    display: "standalone", orientation: "portrait-primary", categories: ["books", "education", "lifestyle"],
    background_color: branding.colors.navy, theme_color: branding.colors.navy,
    icons: [
      { src: "/branding/hineni-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/branding/hineni-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // App icon artwork is an opaque square canvas, so it is safe for platform masks.
      { src: "/branding/hineni-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Bible", url: "/bible", icons: [{ src: "/branding/hineni-icon-192.png", sizes: "192x192" }] },
      { name: "Reading Plans", url: "/plans", icons: [{ src: "/branding/hineni-icon-192.png", sizes: "192x192" }] },
      { name: "Prayer", url: "/prayer", icons: [{ src: "/branding/hineni-icon-192.png", sizes: "192x192" }] },
    ],
  };
}
