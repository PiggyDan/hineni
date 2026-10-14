import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PasswordRecovery } from "@/components/auth/password-recovery";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: (await getTranslations({ locale, namespace: "auth" }))("resetTitle"), robots: { index: false, follow: false } };
}
export default function ForgotPasswordPage() {
  return <div className="container-page flex min-h-[70vh] items-center py-16"><PasswordRecovery /></div>;
}
