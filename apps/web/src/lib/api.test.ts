import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { z } from "zod";

const mocks = vi.hoisted(() => ({ session: vi.fn(), role: vi.fn(), limit: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("./env", () => ({ env: () => ({ APP_URL: "https://ruah.test", TRUSTED_ORIGINS: "" }) }));
vi.mock("./session", () => ({ getCurrentUser: mocks.session, hasRole: mocks.role }));
vi.mock("./rate-limit", () => ({ rateLimit: mocks.limit }));
import { body, handler } from "./api";

beforeEach(() => { vi.clearAllMocks(); mocks.session.mockResolvedValue(null); mocks.role.mockReturnValue(false); mocks.limit.mockResolvedValue(true); });
const ctx = { params: Promise.resolve({}) };
describe("protected API boundary", () => {
  it("rejects unauthenticated requests before private queries execute", async () => {
    const query = vi.fn(); const response = await handler({ auth: true }, query)(new NextRequest("https://ruah.test/api/v1/me/notes"), ctx);
    expect(response.status).toBe(401); expect(query).not.toHaveBeenCalled();
  });
  it("checks roles server-side", async () => {
    mocks.session.mockResolvedValue({ id: "user-1", role: "USER" }); const query = vi.fn();
    const response = await handler({ roles: ["ADMIN"] }, query)(new NextRequest("https://ruah.test/api/v1/admin"), ctx);
    expect(response.status).toBe(403); expect(query).not.toHaveBeenCalled();
  });
  it.each([["origin", "https://attacker.test"], ["sec-fetch-site", "cross-site"]])("rejects cross-site writes (%s)", async (key, value) => {
    const query = vi.fn();
    const response = await handler({}, query)(new NextRequest("https://ruah.test/api/v1/me/notes", { method: "POST", headers: { [key!]: value! } }), ctx);
    expect(response.status).toBe(403); expect(query).not.toHaveBeenCalled();
  });
  it("never allows intermediaries to cache private responses", async () => {
    mocks.session.mockResolvedValue({ id: "user-1", role: "USER" });
    const response = await handler({ auth: true }, async () => ({ body: "private" }))(new NextRequest("https://ruah.test/api/v1/me/notes"), ctx);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
  it("validates JSON and stops requests over the rate limit", async () => {
    const route = handler({ limit: [1, 60] }, async ({ req }) => body(req, z.object({ name: z.string().min(1) })));
    const request = () => new NextRequest("https://ruah.test/api/v1/example", { method: "POST", headers: { origin: "https://ruah.test", "content-type": "application/json" }, body: "{}" });
    expect((await route(request(), ctx)).status).toBe(400);
    mocks.limit.mockResolvedValue(false); expect((await route(request(), ctx)).status).toBe(429);
  });
});
