import { NextResponse } from "next/server";
import { z } from "zod";
import { branding, bookmarkCreateSchema, noteCreateSchema, preferencesSchema, prayerCreateSchema, officialMediaSubmissionSchema, bibleSearchSchema } from "@cp/shared";

const response = (description: string) => ({ description });
const errors = { "400": response("Invalid input"), "401": response("Authentication required"), "403": response("Forbidden origin or insufficient role"), "429": response("Rate limited"), "500": response("Internal failure; no private details returned") };
const jsonBody = (schema: z.ZodType) => ({ required: true, content: { "application/json": { schema: z.toJSONSchema(schema, { unrepresentable: "any" }) } } });
const privateGet = (description: string) => ({ summary: description, security: [{ sessionCookie: [] }], responses: { "200": response("Private response; Cache-Control: private, no-store"), ...errors } });
const privatePost = (description: string, schema: z.ZodType) => ({ summary: description, security: [{ sessionCookie: [] }], requestBody: jsonBody(schema), responses: { "200": response("Saved record"), ...errors } });

export function GET() {
  return NextResponse.json({
    openapi: "3.1.0", info: { title: `${branding.shortName} REST API`, version: "0.1.0", description: "Existing Next.js modular-monolith API. Web uses HTTP-only sessions. Native bearer-token auth is not enabled yet." }, servers: [{ url: "/api/v1" }],
    components: { securitySchemes: { sessionCookie: { type: "apiKey", in: "cookie", name: "better-auth.session_token", description: "Development cookie. HTTPS production uses __Secure-better-auth.session_token. Obtain through /api/auth/sign-in/email; do not read it in browser JavaScript." } } },
    paths: {
      "/health": { get: { summary: "PostgreSQL readiness", responses: { "200": response("Ready"), "503": response("Database unreachable") } } },
      "/bible/translations": { get: { summary: "Available translations and rights metadata", responses: { "200": response("Only enabled editions") } } },
      "/bible/search": { get: { summary: "Indexed word/phrase/reference search in imported editions", parameters: Object.entries(z.toJSONSchema(bibleSearchSchema).properties || {}).map(([name, schema]) => ({ name, in: "query", required: name === "q", schema })), responses: { "200": response("Matching verses or a parsed reference"), "503": response("Edition is not imported"), ...errors } } },
      "/bible/{translation}/{book}/{chapter}": { get: { summary: "Canonical chapter from an enabled Scripture provider", parameters: ["translation", "book", "chapter"].map((name) => ({ name, in: "path", required: true, schema: { type: "string" } })), responses: { "200": response("Chapter verses and attribution"), "404": response("Invalid reference/translation"), "503": response("Provider unavailable"), ...errors } } },
      "/me/preferences": { get: privateGet("Reader/profile preferences"), patch: privatePost("Update validated preferences", preferencesSchema) },
      "/me/bookmarks": { get: privateGet("Only the current user's bookmarks"), post: privatePost("Create an owned bookmark", bookmarkCreateSchema) },
      "/me/notes": { get: privateGet("Only the current user's decrypted notes"), post: privatePost("Create an encrypted private note", noteCreateSchema) },
      "/me/notes/{id}": { delete: { ...privateGet("Delete an owned note"), parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }] } },
      "/me/prayer": { get: privateGet("Only the current user's prayers"), post: privatePost("Create an encrypted private prayer", prayerCreateSchema) },
      "/me/media": { post: { ...privatePost("Submit an official link with rights attestation for editorial review", officialMediaSubmissionSchema), responses: { ...errors, "201": response("Pending review; never published automatically"), "413": response("Payload too large"), "503": response("File upload storage unavailable") } } },
    },
  });
}
