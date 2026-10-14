import { describe, expect, it } from "vitest";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { readFileSync } from "node:fs";

// Read the actual static matcher without loading next-intl's Next runtime in Vitest.
const source = readFileSync(new URL("./proxy.ts", import.meta.url), "utf8");
const literal = source.match(/matcher:\s*("(?:\\.|[^"\\])*")/)?.[1];
if (!literal) throw new Error("Locale proxy requires a static matcher");
const config = { matcher: JSON.parse(literal) as string };

describe("locale proxy", () => {
  it("matches page routes while excluding assets and APIs", () => {
    for (const url of ["/", "/ru", "/ru/ru", "/en/bible/gen/1", "/mn/sign-in"]) {
      expect(unstable_doesMiddlewareMatch({ config, url })).toBe(true);
    }
    for (const url of ["/api/v1/health", "/_next/static/app.js", "/branding/hineni-logo-dark.svg", "/manifest.webmanifest"]) {
      expect(unstable_doesMiddlewareMatch({ config, url })).toBe(false);
    }
  });
});
