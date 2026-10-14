import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans, Noto_Serif } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { brandName, brandTagline, branding, themes } from "@cp/shared";
import { AppShell } from "@/components/layout/app-shell";
import { BackgroundMusic } from "@/components/layout/background-music";
import { ServiceWorker } from "@/components/pwa/service-worker";
import { routing } from "@/i18n/routing";
import { themeCss } from "@/lib/theme-css";
import "../globals.css";

// Noto Serif carries Latin, Cyrillic (incl. Mongolian Ө/Ү) and polytonic Greek for Scripture.
const serif = Noto_Serif({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext", "greek", "greek-ext"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});
const ui = Inter({ subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext", "greek"], variable: "--font-inter", display: "swap" });
const mongolianUi = Noto_Sans({
  subsets: ["cyrillic", "cyrillic-ext", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans",
  display: "swap",
  preload: false,
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const name = brandName(locale);
  const localeTagline = brandTagline(locale);
  return {
    title: { default: name, template: `%s · ${name}` },
    description: t("description"),
    metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
    alternates: { languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])) },
    applicationName: branding.shortName,
    appleWebApp: { capable: true, title: branding.shortName, statusBarStyle: "default" },
    icons: {
      icon: [{ url: branding.iconPath, type: "image/svg+xml" }, { url: "/branding/favicon-32.png", sizes: "32x32", type: "image/png" }, { url: "/branding/favicon-16.png", sizes: "16x16", type: "image/png" }],
      shortcut: "/branding/favicon.ico",
      apple: [{ url: "/branding/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    manifest: "/manifest.webmanifest",
    openGraph: { title: name, description: localeTagline, siteName: name, type: "website", images: [{ url: branding.socialImagePath, width: 1200, height: 630, alt: `${branding.shortName} — ${branding.meaning}` }] },
    twitter: { card: "summary_large_image", title: name, description: localeTagline, images: [branding.socialImagePath] },
  };
}

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: themes.light.background },
    { media: "(prefers-color-scheme: dark)", color: themes.dark.background },
  ],
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("common");

  return (
    <div
      lang={locale}
      dir={locale === "ar" || locale === "he" ? "rtl" : "ltr"}
      className={`app-root ${serif.variable} ${ui.variable} ${mongolianUi.variable} antialiased`}
    >
      <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      <NextIntlClientProvider>
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-on-primary focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          {t("skipToContent")}
        </a>
        <AppShell>{children}</AppShell>
        <BackgroundMusic />
        <ServiceWorker />
      </NextIntlClientProvider>
    </div>
  );
}
