import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthCard } from "@/components/auth/auth-card";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/session";
import { env } from "@/lib/env";
import { brandName } from "@cp/shared";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: (await getTranslations({ locale, namespace: "nav" }))("signUp"), robots: { index: false, follow: false } };
}

export default async function SignUpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getCurrentUser();
  if (user) redirect({ href: "/", locale });

  const t = await getTranslations({ locale });

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <AuthCard
        mode="sign-up"
        googleEnabled={!!(env().GOOGLE_CLIENT_ID && env().GOOGLE_CLIENT_SECRET)}
        title={t("nav.signUp")}
        subtitle={t("foundation.signUpBody", { brand: brandName(locale) })}
        secondaryHref="/sign-in"
        secondaryLabel={t("auth.haveAccount")}
      />
    </div>
  );
}
