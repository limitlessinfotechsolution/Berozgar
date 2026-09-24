import { sizeAvailable, sortSizes, type Product } from "@/lib/products";

/*
 * Shop listing logic — pure, so the desktop sidebar, the mobile sheet and the
 * tests all read one definition. The URL query is the state: every filter is a
 * search param, so a filtered shop can be shared, bookmarked and backed out of.
 *
 * Every option is derived from the catalogue itself. A filter the catalogue
 * can't answer (no product has a fit, say) is not offered at all.
 */

export type Query = Record<string, string>;

export const PAGE_SIZE = 12;

/* Pseudo-categories that cut across the ERP's real categories. */
export const SALE = "sale";
export const DROPS = "drops";

export const SORTS: [string, string][] = [
  ["featured", "FEATURED"],
  ["newest", "NEWEST"],
  ["price-asc", "PRICE: LOW → HIGH"],
  ["price-desc", "PRICE: HIGH → LOW"],
];

const PRICE_CAPS = [999, 1500, 2500];

/* Whole-percent saving, for the card badge. Null when there is no real discount. */
export function discountPercent(p: Pick<Product, "price" | "compareAt">): number | null {
  if (!p.compareAt || p.compareAt <= p.price) return null;
  const pct = Math.round((1 - p.price / p.compareAt) * 100);
  return pct > 0 ? pct : null;
}

export type Facets = {
  sizes: string[];
  colors: string[];
  fits: string[];
  collections: string[];
  priceCaps: [string, string][];
  hasSale: boolean;
};

export function facetsOf(all: Product[]): Facets {
  const distinct = (values: string[]) => [...new Set(values.filter(Boolean))].sort();
  const prices = all.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return {
    sizes: sortSizes([...new Set(all.flatMap((p) => p.sizes))]),
    colors: distinct(all.flatMap((p) => p.colors)),
    fits: distinct(all.map((p) => p.fit)),
    collections: distinct(all.map((p) => p.collection)),
    // Only caps that actually split the catalogue: one that includes everything,
    // or nothing, filters nothing.
    priceCaps: PRICE_CAPS.filter((cap) => cap >= min && cap < max).map((cap): [string, string] => [
      String(cap),
      `UNDER ₹${cap.toLocaleString("en-IN")}`,
    ]),
    hasSale: all.some((p) => discountPercent(p) !== null),
  };
}

export function applyFilters(all: Product[], q: Query): Product[] {
  let list = [...all];

  if (q.cat === SALE) list = list.filter((p) => discountPercent(p) !== null);
  else if (q.cat === DROPS) list = list.filter((p) => p.collection);
  else if (q.cat && q.cat !== "all") list = list.filter((p) => p.category === q.cat);

  if (q.size) list = list.filter((p) => p.sizes.includes(q.size) && sizeAvailable(p, q.size, null));
  if (q.color) list = list.filter((p) => p.colors.includes(q.color.toUpperCase()));
  if (q.fit) list = list.filter((p) => p.fit === q.fit.toUpperCase());
  if (q.collection) list = list.filter((p) => p.collection === q.collection.toUpperCase());
  if (q.avail === "instock") list = list.filter((p) => !p.soldout);
  if (q.max) list = list.filter((p) => p.price <= Number(q.max));

  const sort = q.sort || "featured";
  if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
  else if (sort === "newest") list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  // "featured" keeps the ERP's order, but sold-out products sink to the end.
  else list.sort((a, b) => Number(a.soldout) - Number(b.soldout));
  return list;
}

/* Filters that narrow the list — not the tab, the sort or the page. */
export function activeFilterCount(q: Query): number {
  return ["size", "color", "fit", "collection", "avail", "max"].filter((k) => q[k]).length;
}

/* How many products the page shows: whole pages, clamped to what exists. */
export function visibleCount(total: number, page: string | undefined): number {
  const n = Math.max(1, Math.floor(Number(page) || 1));
  return Math.min(total, n * PAGE_SIZE);
}

export function buildShopHref(q: Query): string {
  const params = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => { if (v) params.set(k, v); });
  const s = params.toString();
  return s ? `/shop?${s}` : "/shop";
}
