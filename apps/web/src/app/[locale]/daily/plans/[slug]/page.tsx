import { redirect } from "@/i18n/navigation";

/** Plans moved to /plans; keep old links working. */
export default async function LegacyPlanPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  redirect({ href: `/plans/${slug}`, locale });
}
