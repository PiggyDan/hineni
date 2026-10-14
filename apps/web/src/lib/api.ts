import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";
import type { Role } from "@cp/shared";
import { env } from "./env";
import { rateLimit } from "./rate-limit";
import { getCurrentUser, hasRole, type CurrentUser } from "./session";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}

export const notFound = () => new ApiError(404, "not_found");
export const forbidden = () => new ApiError(403, "forbidden");

export function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

/** Rejects cross-site browser writes. Native mobile clients send no Origin header. */
function checkOrigin(req: NextRequest) {
  if (SAFE.has(req.method)) return;
  if (req.headers.get("sec-fetch-site") === "cross-site") throw new ApiError(403, "bad_origin");
  const origin = req.headers.get("origin");
  if (!origin) return;
  const allowed = [env().APP_URL, ...env().TRUSTED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)];
  if (!allowed.some((a) => new URL(a).origin === origin)) throw new ApiError(403, "bad_origin");
}

interface Options {
  auth?: boolean;
  roles?: Role[];
  /** [max requests, window seconds] per user (or IP when anonymous). */
  limit?: [number, number];
}

type Ctx<P> = { req: NextRequest; params: P; user: CurrentUser | null };
type AuthedCtx<P> = { req: NextRequest; params: P; user: CurrentUser };

export function handler<P = Record<string, string>>(
  opts: Options,
  fn: (ctx: Ctx<P> | AuthedCtx<P>) => Promise<unknown>,
): (req: NextRequest, ctx: { params: Promise<P> }) => Promise<Response> {
  return async (req: NextRequest, ctx: { params: Promise<P> }) => {
    try {
      checkOrigin(req);
      const user = opts.auth || opts.roles ? await getCurrentUser() : null;
      if ((opts.auth || opts.roles) && !user) throw new ApiError(401, "unauthorized");
      if (opts.roles && !hasRole(user, opts.roles)) throw forbidden();
      const limit = opts.limit ?? (opts.auth || opts.roles ? [120, 60] : undefined);
      if (limit) {
        const [max, win] = limit;
        const key = `${req.method}:${req.nextUrl.pathname}:${user?.id ?? clientIp(req)}`;
        if (!(await rateLimit(key, max, win))) throw new ApiError(429, "rate_limited");
      }
      const result = await fn({ req, params: await ctx.params, user });
      if (result instanceof Response) {
        if (opts.auth || opts.roles) result.headers.set("Cache-Control", "private, no-store");
        return result;
      }
      if (result === undefined) return new NextResponse(null, { status: 204 });
      return NextResponse.json(result, { headers: opts.auth || opts.roles ? { "Cache-Control": "private, no-store", Vary: "Cookie" } : undefined });
    } catch (err) {
      if (err instanceof ApiError) return NextResponse.json({ error: err.code, message: err.message }, { status: err.status });
      if (err instanceof ZodError)
        return NextResponse.json({ error: "invalid_input", issues: err.issues.map((i) => ({ path: i.path, message: i.message })) }, { status: 400 });
      // Log an error category without dumping SQL arguments, tokens or private data.
      console.error("API request failed", err instanceof Error ? err.name : "unknown");
      return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }
  };
}

export async function body<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  const json = await req.json().catch(() => {
    throw new ApiError(400, "invalid_json");
  });
  return schema.parse(json);
}

export function query<T>(req: NextRequest, schema: ZodType<T>): T {
  return schema.parse(Object.fromEntries(req.nextUrl.searchParams));
}
