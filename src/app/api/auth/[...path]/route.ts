import type { NextRequest } from "next/server";
import { proxyAccount } from "@/lib/erp-account-proxy";

/* Shopper auth calls, forwarded to the ERP with the session cookie as a bearer token. */
type Ctx = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyAccount(request, "auth", path);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
