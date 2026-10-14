import { branding } from "@cp/shared";

export function GET() {
  return new Response(null, { status: 307, headers: { Location: branding.iconPath, "Cache-Control": "public, max-age=3600" } });
}
