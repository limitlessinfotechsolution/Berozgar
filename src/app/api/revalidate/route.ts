import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

/*
 * Called by the ERP admin (apps/admin/lib/storefront.ts) after it changes data
 * this site caches. Expires the tags immediately — `{ expire: 0 }` is the form
 * the Next docs give for external webhooks (revalidateTag.md).
 *
 * Only known tags are accepted, and only with the shared secret
 * (REVALIDATE_SECRET here, STOREFRONT_REVALIDATE_SECRET in the ERP).
 */
const ALLOWED_TAGS = new Set(["catalogue", "orders", "legal", "reviews"]);

function secretMatches(given: string | null): boolean {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!secretMatches(request.headers.get("x-revalidate-secret"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { tags?: unknown };
  const tags = Array.isArray(body.tags) ? body.tags.filter((t): t is string => typeof t === "string") : [];
  const accepted = tags.filter((t) => ALLOWED_TAGS.has(t));
  if (accepted.length === 0) {
    return NextResponse.json({ error: "no known tags", allowed: [...ALLOWED_TAGS] }, { status: 400 });
  }

  for (const tag of accepted) revalidateTag(tag, { expire: 0 });
  return NextResponse.json({ revalidated: accepted, now: Date.now() });
}
