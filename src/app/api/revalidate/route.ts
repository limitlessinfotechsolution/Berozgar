import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { BROAD_TAGS, acceptTag } from "@/lib/cache-tags";

/*
 * Called by the ERP (packages/database/src/storefront-cache.ts — the admin, the
 * API and the worker's order-event backstop) after it changes data
 * this site caches. Expires the tags immediately — `{ expire: 0 }` is the form
 * the Next docs give for external webhooks (revalidateTag.md).
 *
 * Only known tags are accepted — the broad ones plus order:/review:/product:
 * scoped ones (src/lib/cache-tags.ts) — and only with the shared secret
 * (REVALIDATE_SECRET here, STOREFRONT_REVALIDATE_SECRET in the ERP).
 */

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
  const accepted = [...new Set(tags.slice(0, 50).map(acceptTag).filter((t): t is string => t !== null))];
  if (accepted.length === 0) {
    return NextResponse.json(
      { error: "no known tags", allowed: [...BROAD_TAGS, "order:<number>", "review:<slug>", "product:<slug>"] },
      { status: 400 },
    );
  }

  for (const tag of accepted) revalidateTag(tag, { expire: 0 });
  return NextResponse.json({ revalidated: accepted, now: Date.now() });
}
