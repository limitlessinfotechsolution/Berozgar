import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxyAccount } from "@/lib/erp-account-proxy";

const fetchMock = vi.fn();

function req(path: string, init: { method?: string; body?: unknown; cookie?: string; origin?: string | null } = {}) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (init.cookie) headers.cookie = init.cookie;
  if (init.origin !== null) headers.origin = init.origin ?? "http://shop.test";
  return new NextRequest(`http://shop.test${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

function erpAnswers(status: number, body: unknown) {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

describe("account proxy", () => {
  beforeEach(() => {
    vi.stubEnv("ERP_API_URL", "http://erp.test");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("moves the session token into an httpOnly, SameSite=Lax cookie and out of the JSON", async () => {
    erpAnswers(200, { customer: { name: "A" }, session: { token: "bzc_secret", expiresAt: "2030-01-01T00:00:00Z" } });
    const res = await proxyAccount(req("/api/auth/login", { method: "POST", body: { identifier: "a", password: "b" } }), "auth", ["login"]);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ customer: { name: "A" } });
    expect(JSON.stringify(json)).not.toContain("bzc_secret");
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("bz_session=bzc_secret");
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  it("marks the cookie Secure in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    erpAnswers(200, { session: { token: "bzc_secret", expiresAt: "2030-01-01T00:00:00Z" } });
    const res = await proxyAccount(req("/api/auth/login", { method: "POST", body: {} }), "auth", ["login"]);
    expect(res.headers.get("set-cookie")).toMatch(/Secure/i);
  });

  it("refuses a state change from another site, before calling the ERP", async () => {
    const res = await proxyAccount(req("/api/account/profile", { method: "PATCH", body: {}, cookie: "bz_session=t", origin: "https://evil.test" }), "account", ["profile"]);
    expect(res.status).toBe(403);
    const noOrigin = await proxyAccount(req("/api/account/profile", { method: "PATCH", body: {}, cookie: "bz_session=t", origin: null }), "account", ["profile"]);
    expect(noOrigin.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers 401 for account data without a cookie, and 404 for auth paths it doesn't know", async () => {
    expect((await proxyAccount(req("/api/account/orders"), "account", ["orders"])).status).toBe(401);
    expect((await proxyAccount(req("/api/auth/admin"), "auth", ["admin"])).status).toBe(404);
    expect((await proxyAccount(req("/api/account/x"), "account", ["..", "x"])).status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("clears the cookie when the ERP says the session is gone", async () => {
    erpAnswers(401, { error: "unauthenticated" });
    const res = await proxyAccount(req("/api/account/orders", { cookie: "bz_session=stale" }), "account", ["orders"]);
    expect(res.status).toBe(401);
    expect(res.headers.get("set-cookie")).toMatch(/bz_session=;.*Max-Age=0/i);
  });
});
