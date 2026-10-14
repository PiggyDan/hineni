import { defineRouting } from "next-intl/routing";
import { defaultLocale, locales } from "@cp/shared";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeCookie: { maxAge: 60 * 60 * 24 * 365, sameSite: "lax" },
});
