import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { withoutLocalePrefixes } from "./i18n/locale-path";
import { NextResponse, type NextRequest } from "next/server";

const handleLocale = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const segments = request.nextUrl.pathname.split("/").filter(Boolean);
  const isLocale = (segment: string | undefined) => segment !== undefined && (routing.locales as readonly string[]).includes(segment);
  if (isLocale(segments[0]) && isLocale(segments[1])) {
    const target = request.nextUrl.clone();
    const page = withoutLocalePrefixes(target.pathname);
    target.pathname = `/${segments[0]}${page === "/" ? "" : page}`;
    return NextResponse.redirect(target, 307);
  }
  return handleLocale(request);
}

export const config = {
  // Everything except API routes, Next internals and files with an extension.
  matcher: "/((?!api|_next|_vercel|uploads|.*[.].*).*)",
};
