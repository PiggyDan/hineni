import Image from "next/image";
import { branding } from "@cp/shared";

export function BrandLogo({ variant = "horizontal", className = "", decorative = false }: {
  variant?: "horizontal" | "vertical" | "symbol"; className?: string; decorative?: boolean;
}) {
  const size = variant === "symbol" ? { width: 320, height: 320 } : variant === "vertical" ? { width: 440, height: 620 } : { width: 450, height: 160 };
  const paths = branding.assets[variant];
  const alt = decorative ? "" : `${branding.shortName} — ${branding.hebrewName}`;
  return <span className={`inline-block shrink-0 ${className}`}>
    <Image src={paths.light} {...size} alt={alt} unoptimized className="h-auto w-full dark:hidden" />
    <Image src={paths.dark} {...size} alt={alt} unoptimized className="hidden h-auto w-full dark:block" />
  </span>;
}
