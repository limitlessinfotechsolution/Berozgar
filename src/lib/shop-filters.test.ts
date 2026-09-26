import { describe, expect, it } from "vitest";
import type { Product } from "@/lib/products";
import { activeFilterCount, applyFilters, discountPercent, facetsOf, visibleCount } from "@/lib/shop-filters";

const product = (over: Partial<Product>): Product => ({
  id: over.slug ?? "p",
  slug: "p",
  name: "P",
  word: "P",
  priceMinor: 99900,
  compareAtMinor: null,
  category: "t-shirts",
  categoryName: "T-SHIRTS",
  colors: ["BLACK"],
  sizes: ["M"],
  oos: [],
  badges: [],
  gsm: "",
  fabric: "",
  fit: "",
  collection: "",
  createdAt: "2026-09-01T00:00:00Z",
  description: "",
  stock: null,
  soldout: false,
  images: [],
  variants: [{ id: "v", size: "M", colour: "BLACK", stock: 5 }],
  ...over,
});

const a = product({ slug: "a", priceMinor: 79900, compareAtMinor: 119900, fit: "OVERSIZED", createdAt: "2026-09-10T00:00:00Z" });
const b = product({ slug: "b", priceMinor: 149900, collection: "DROP 001", colors: ["WHITE"], createdAt: "2026-09-20T00:00:00Z" });
const c = product({ slug: "c", priceMinor: 299900, soldout: true, category: "hoodies" });
const all = [c, a, b];

describe("discountPercent", () => {
  it("rounds the saving and ignores fake discounts", () => {
    expect(discountPercent({ priceMinor: 79900, compareAtMinor: 119900 })).toBe(33);
    expect(discountPercent({ priceMinor: 99900, compareAtMinor: 99900 })).toBeNull();
    expect(discountPercent({ priceMinor: 99900, compareAtMinor: null })).toBeNull();
  });
});

describe("applyFilters", () => {
  const slugs = (q: Record<string, string>) => applyFilters(all, q).map((p) => p.slug);

  it("SALE and DROPS cut across categories", () => {
    expect(slugs({ cat: "sale" })).toEqual(["a"]);
    expect(slugs({ cat: "drops" })).toEqual(["b"]);
    expect(slugs({ cat: "hoodies" })).toEqual(["c"]);
  });

  it("filters by fit, collection, colour, stock and price", () => {
    expect(slugs({ fit: "oversized" })).toEqual(["a"]);
    expect(slugs({ collection: "drop 001" })).toEqual(["b"]);
    expect(slugs({ color: "white" })).toEqual(["b"]);
    expect(slugs({ avail: "instock" })).toEqual(["a", "b"]);
    expect(slugs({ max: "1500" })).toEqual(["a", "b"]);
  });

  it("sorts newest first, and featured sinks sold-out items", () => {
    expect(slugs({ sort: "newest" })).toEqual(["b", "a", "c"]);
    expect(slugs({})).toEqual(["a", "b", "c"]);
    expect(slugs({ sort: "price-desc" })).toEqual(["c", "b", "a"]);
  });
});

describe("facetsOf", () => {
  it("only offers what the catalogue holds", () => {
    const f = facetsOf(all);
    expect(f.fits).toEqual(["OVERSIZED"]);
    expect(f.collections).toEqual(["DROP 001"]);
    expect(f.hasSale).toBe(true);
    expect(f.priceCaps.map(([v]) => v)).toEqual(["999", "1500", "2500"]);
  });

  it("drops price caps that split nothing", () => {
    expect(facetsOf([a]).priceCaps).toEqual([]);
  });
});

describe("paging", () => {
  it("shows whole pages clamped to the total", () => {
    expect(visibleCount(30, undefined)).toBe(12);
    expect(visibleCount(30, "2")).toBe(24);
    expect(visibleCount(30, "9")).toBe(30);
    expect(visibleCount(30, "junk")).toBe(12);
  });

  it("counts narrowing filters, not the tab or sort", () => {
    expect(activeFilterCount({ cat: "sale", sort: "newest", page: "2" })).toBe(0);
    expect(activeFilterCount({ size: "M", max: "999" })).toBe(2);
  });
});
