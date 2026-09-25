import { NextResponse, type NextRequest } from "next/server";
import { erpUrl } from "@/lib/catalogue";

/*
 * The shopper's ERP session, held for them by this server (ERP docs/adr/0007).
 *
 * The ERP issues an opaque bearer token; the browser only ever gets it inside an
 * httpOnly cookie, so page scripts can't read or leak it. Route handlers here read the
 * cookie and call the ERP with `Authorization: Bearer`, plus two headers that let the
 * ERP rate-limit the real shopper rather than this server: `x-bz-client-ip` and the
 * shared `x-bz-storefront` secret that makes the ERP believe it.
 */

export const SESSION_COOKIE = "bz_session";

/** The shopper's address as this server saw it (rightmost hop, past our own proxies). */
export function shopperIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map((h) => h.trim()).filter(Boolean);
    const trusted = Number.parseInt(process.env.TRUSTED_PROXY_COUNT ?? "0", 10) || 0;
    const hop = hops[Math.max(0, hops.length - 1 - trusted)];
    if (hop) return hop;
  }
  return request.headers.get("x-real-ip") ?? "127.0.0.1";
}

/** Headers every ERP call from this server carries. */
export function erpHeaders(request: Request, token?: string | null): Record<string, string> {
  const secret = process.env.ERP_SERVER_SECRET;
  return {
    "x-forwarded-for": shopperIp(request),
    "x-bz-client-ip": shopperIp(request),
    ...(secret ? { "x-bz-storefront": secret } : {}),
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };
}

export function sessionToken(request: NextRequest): string | null {
  return request.cookies.get(SESSION_COOKIE)?.value ?? null;
}

export function setSessionCookie(response: NextResponse, token: string, expiresAt: string | Date): void {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/**
 * Cross-site form posts can't ride the cookie: a changing request must come from a
 * page on this site (Origin, or Referer when a browser omits Origin).
 */
export function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin") ?? request.headers.get("referer");
  if (!origin) return false;
  try {
    return new URL(origin).host === request.nextUrl.host;
  } catch {
    return false;
  }
}

/** Calls the ERP public API and returns its status and JSON (or null). */
export async function callErp(
  request: Request,
  path: string,
  init: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<{ status: number; body: unknown }> {
  try {
    const response = await fetch(erpUrl(path), {
      method: init.method ?? "GET",
      headers: {
        ...erpHeaders(request, init.token),
        ...(init.body !== undefined ? { "content-type": "application/json" } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
    const text = await response.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }
    return { status: response.status, body };
  } catch (error) {
    console.error(`[erp-session] ${path} unreachable:`, error);
    return { status: 502, body: { error: "unavailable", message: "We can't reach our servers right now. Try again in a moment." } };
  }
}
