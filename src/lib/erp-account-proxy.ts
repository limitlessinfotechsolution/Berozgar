import { NextResponse, type NextRequest } from "next/server";
import {
  callErp,
  clearSessionCookie,
  sameOrigin,
  sessionToken,
  setSessionCookie,
} from "@/lib/erp-session";

/*
 * Browser → this server → ERP for /api/auth/* and /api/account/*.
 *
 * - The session token never reaches the page: a response carrying `session.token` has it
 *   moved into the httpOnly cookie and removed from the JSON.
 * - Logout, and any 401 on a request that had a cookie, clear the cookie.
 * - Anything that changes state must come from a page on this site (Origin check).
 */

const AUTH_PATHS = new Set([
  "register",
  "login",
  "otp/request",
  "otp/verify",
  "logout",
  "session",
  "password/forgot",
  "password/reset",
  "email/verify",
  "email/verify/resend",
]);

const SEGMENT = /^[A-Za-z0-9._-]{1,80}$/;

type Session = { token?: unknown; expiresAt?: unknown };

export async function proxyAccount(
  request: NextRequest,
  area: "auth" | "account",
  segments: string[],
): Promise<NextResponse> {
  const path = segments.join("/");
  if (!segments.length || !segments.every((s) => SEGMENT.test(s)) || (area === "auth" && !AUTH_PATHS.has(path))) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const method = request.method.toUpperCase();
  if (method !== "GET" && !sameOrigin(request)) {
    return NextResponse.json({ error: "forbidden", message: "Cross-site request refused." }, { status: 403 });
  }

  const token = sessionToken(request);
  if (area === "account" && !token) {
    return NextResponse.json({ error: "unauthenticated", message: "Please sign in." }, { status: 401 });
  }

  let body: unknown;
  if (method !== "GET" && method !== "DELETE") {
    const text = await request.text();
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        return NextResponse.json({ error: "bad_request", message: "Malformed request." }, { status: 400 });
      }
    }
  }

  const search = request.nextUrl.search;
  const result = await callErp(request, `/${area}/${path}${search}`, { method, body, token });

  let payload = result.body;
  let session: Session | null = null;
  if (payload && typeof payload === "object" && "session" in payload) {
    const { session: s, ...rest } = payload as { session: Session };
    session = s;
    payload = rest;
  }

  // 204/205/304 may not carry a body; NextResponse.json would throw.
  const bodyless = result.status === 204 || result.status === 205 || result.status === 304;
  const response = bodyless
    ? new NextResponse(null, { status: result.status, headers: { "cache-control": "no-store" } })
    : NextResponse.json(payload ?? {}, { status: result.status, headers: { "cache-control": "no-store" } });
  if (session && typeof session.token === "string" && session.expiresAt) {
    setSessionCookie(response, session.token, session.expiresAt as string);
  } else if ((area === "auth" && path === "logout") || (token && result.status === 401)) {
    clearSessionCookie(response);
  }
  return response;
}
