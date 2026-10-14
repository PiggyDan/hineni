import { useTranslations } from "next-intl";
import { buttonClass } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("common");
  return (
    <div className="container-page flex flex-col items-center gap-6 py-28 text-center">
      <span aria-hidden className="font-display text-5xl text-accent">
        ✣
      </span>
      <h1 className="text-4xl font-semibold">{t("notFound")}</h1>
      <Link href="/" className={buttonClass("primary")}>
        {t("goHome")}
      </Link>
    </div>
  );
}
