import { describe, expect, it } from "vitest";
import { categoriesOf, displayPrice, toProduct, type ErpProduct } from "@/lib/catalogue-map";
import { sizeAvailable } from "@/lib/products";

const erp = (overrides: Partial<ErpProduct> = {}): ErpProduct => ({
  id: "p1",
  slug: "bz-ts-classic",
  sku: "BZ-TS-CLASSIC",
  name: "Classic T-Shirt",
  description: "Blank tee",
  basePrice: "399.00",
  category: { id: "c1", name: "T-Shirts" },
  images: [],
  variants: [
    { id: "v1", size: "M", colour: "Black", stock: 5 },
    { id: "v2", size: "XL", colour: "Black", stock: 0 },
    { id: "v3", size: "S", colour: "White", stock: 40 },
    { id: "v4", size: "XL", colour: "White", stock: 0 },
  ],
  ...overrides,
});

describe("toProduct", () => {
  it("maps identity, price and category", () => {
    const p = toProduct(erp());
    expect(p).toMatchObject({ id: "p1", slug: "bz-ts-classic", name: "CLASSIC T-SHIRT", price: 399 });
    expect(p.category).toBe("t-shirts");
    expect(p.categoryName).toBe("T-SHIRTS");
  });

  it("orders sizes S → XL and lists colours once", () => {
    const p = toProduct(erp());
    expect(p.sizes).toEqual(["S", "M", "XL"]);
    expect(p.colors).toEqual(["BLACK", "WHITE"]);
  });

  it("marks a size out of stock only when every colour is empty", () => {
    const p = toProduct(erp());
    expect(p.oos).toEqual(["p1:XL"]);
    expect(sizeAvailable(p, "M", "BLACK")).toBe(true);
    expect(sizeAvailable(p, "M", "WHITE")).toBe(false); // no such variant
  });

  it("shows a low-stock count only when low, and sold out at zero", () => {
    expect(toProduct(erp()).stock).toBeNull(); // 45 units
    expect(toProduct(erp({ variants: [{ id: "v", size: "M", colour: "Black", stock: 3 }] })).stock).toBe(3);
    const empty = toProduct(erp({ variants: [{ id: "v", size: "M", colour: "Black", stock: 0 }] }));
    expect(empty.soldout).toBe(true);
    expect(empty.stock).toBeNull();
  });

  it("does not invent merchandising the ERP doesn't hold", () => {
    const p = toProduct(erp());
    expect(p).toMatchObject({ compareAt: null, badges: [], gsm: "", fabric: "", fit: "" });
    /* Ratings and reviews aren't mapped to empties any more — the fields are gone
       from Product entirely, so a reviews UI can't silently render against zeros. */
    expect(p).not.toHaveProperty("rating");
    expect(p).not.toHaveProperty("reviews");
  });

  it("maps the ERP's optional merchandising when it is set", () => {
    const p = toProduct(
      erp({ compareAtPrice: "599.00", fit: "oversized", collection: "Drop 001", badge: "new", createdAt: "2026-09-20T00:00:00Z" })
    );
    expect(p).toMatchObject({
      compareAt: 599,
      fit: "OVERSIZED",
      collection: "DROP 001",
      badges: ["NEW"],
      createdAt: "2026-09-20T00:00:00Z",
    });
  });

  it("uses uploaded images in order", () => {
    const p = toProduct(erp({ images: [{ id: "i1", url: "a.jpg" }, { id: "i2", url: "b.jpg" }] }));
    expect(p.images).toEqual(["a.jpg", "b.jpg"]);
  });
});

describe("displayPrice", () => {
  it("parses decimal strings and rounds for display", () => {
    expect(displayPrice("599.00")).toBe(599);
    expect(displayPrice("599.50")).toBe(600);
    expect(displayPrice("nonsense")).toBe(0);
  });
});

describe("categoriesOf", () => {
  it("counts products per category", () => {
    const list = [toProduct(erp()), toProduct(erp({ id: "p2" })), toProduct(erp({ id: "p3", category: null }))];
    expect(categoriesOf(list)).toEqual([
      { slug: "t-shirts", name: "T-SHIRTS", count: 2 },
      { slug: "uncategorised", name: "UNCATEGORISED", count: 1 },
    ]);
  });
});
