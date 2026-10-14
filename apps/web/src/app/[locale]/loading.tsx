import { getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/branding/brand-logo";

export default async function Loading() {
  const t = await getTranslations("common");
  return <div role="status" className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 py-12"><BrandLogo variant="vertical" className="w-44" /><span className="size-6 animate-spin rounded-full border-2 border-line border-t-accent motion-reduce:animate-none" aria-hidden /><p className="text-sm text-ink-muted">{t("loading")}</p></div>;
}
