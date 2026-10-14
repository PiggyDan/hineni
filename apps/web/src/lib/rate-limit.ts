import "server-only";
import { prisma } from "@cp/db";

/**
 * Fixed-window limiter stored in PostgreSQL so it holds across instances.
 * Returns true when the request is allowed.
 */
export async function rateLimit(key: string, max: number, windowSec: number): Promise<boolean> {
  const now = Date.now();
  const id = `api:${key}`;
  try {
    const rows = await prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO rate_limit (id, key, count, "lastRequest")
      VALUES (${id}, ${id}, 1, ${now})
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN rate_limit."lastRequest" < ${now - windowSec * 1000} THEN 1 ELSE rate_limit.count + 1 END,
        "lastRequest" = CASE WHEN rate_limit."lastRequest" < ${now - windowSec * 1000} THEN ${now} ELSE rate_limit."lastRequest" END
      RETURNING count`;
    return (rows[0]?.count ?? 1) <= max;
  } catch (err) {
    console.error("rate limit storage unavailable", err instanceof Error ? err.name : "unknown");
    throw new Error("Rate limit storage unavailable");
  }
}
