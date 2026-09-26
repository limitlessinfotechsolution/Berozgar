/*
 * Cache tags the ERP can expire through POST /api/revalidate.
 *
 * Broad tags cover a whole kind of data; scoped tags ("order:BZ1042") cover one
 * record, so a status change on one order doesn't evict every other order's
 * tracking answer. Fetches carry both — the broad tag stays the big hammer.
 *
 * Shared by the fetches and the revalidate route, so a tag this site caches under
 * is always one the ERP is allowed to expire (ERP: packages/database/src/storefront-cache.ts).
 */

export const BROAD_TAGS = ["catalogue", "orders", "legal", "reviews", "settings"] as const;

const SCOPES = ["order", "review", "product"] as const;
type Scope = (typeof SCOPES)[number];

/* Order numbers are upper-case, slugs lower-case; either way letters, digits and hyphens. */
const KEY = /^[A-Za-z0-9-]{1,64}$/;

function scoped(scope: Scope, key: string): string {
  return `${scope}:${scope === "order" ? key.toUpperCase() : key.toLowerCase()}`;
}

export const orderTag = (orderNumber: string) => scoped("order", orderNumber);
export const reviewTag = (productSlug: string) => scoped("review", productSlug);
export const productTag = (productSlug: string) => scoped("product", productSlug);

/* A tag the ERP may expire, or null. Scoped keys are normalised the way the fetches write them. */
export function acceptTag(tag: string): string | null {
  if ((BROAD_TAGS as readonly string[]).includes(tag)) return tag;
  const [scope, key, ...rest] = tag.split(":");
  if (rest.length > 0 || !key || !KEY.test(key)) return null;
  return (SCOPES as readonly string[]).includes(scope) ? scoped(scope as Scope, key) : null;
}
