import { locales } from "@cp/shared";

/** Locale names are reserved leading route segments, never page names. */
export function withoutLocalePrefixes(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  while (segments.length && (locales as readonly string[]).includes(segments[0]!)) segments.shift();
  return segments.length ? `/${segments.join("/")}` : "/";
}

export function languageSwitchHref(pathname: string, search: string, hash: string): string {
  const params = new URLSearchParams(search);
  // Explicit Scripture selection is independent of interface language.
  const query = params.toString();
  return `${withoutLocalePrefixes(pathname)}${query ? `?${query}` : ""}${hash}`;
}
