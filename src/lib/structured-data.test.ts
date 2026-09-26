import { describe, expect, it } from "vitest";
import type { Product } from "@/lib/products";
import { breadcrumbJsonLd, decimalPrice, productJsonLd, serialiseJsonLd } from "@/lib/structured-data";

const product = {
  id: "p1", slug: "bz-ts-classic", name: "CLASSIC T-SHIRT", word: "CLASSIC", priceMinor: 39950, compareAtMinor: null,
  category: "t-shirts", categoryName: "T-SHIRTS", colors: [], sizes: [], oos: [], badges: [], gsm: "", fabric: "", fit: "",
  collection: "", createdAt: "", description: "", stock: null, soldout: false, images: [], variants: [],
} satisfies Product;

describe("structured data", () => {
  it("prices from paise as a decimal string, marked pre-GST", () => {
    expect(decimalPrice(39900)).toBe("399.00");
    expect(decimalPrice(105)).toBe("1.05");
    const offer = productJsonLd(product, "https://shop.test").offers as Record<string, unknown>;
    expect(offer).toMatchObject({ price: "399.50", priceCurrency: "INR", availability: "https://schema.org/InStock" });
    expect(offer.priceSpecification).toMatchObject({ valueAddedTaxIncluded: false });
  });

  it("marks sold-out products out of stock and invents no rating or empty fields", () => {
    const ld = productJsonLd({ ...product, soldout: true }, "https://shop.test");
    expect((ld.offers as Record<string, unknown>).availability).toBe("https://schema.org/OutOfStock");
    expect(ld).not.toHaveProperty("aggregateRating");
    expect(ld).not.toHaveProperty("description");
    expect(ld).not.toHaveProperty("image");
  });

  it("numbers breadcrumbs from 1 with absolute URLs", () => {
    expect(breadcrumbJsonLd([["Shop", "/shop"]], "https://shop.test").itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Shop", item: "https://shop.test/shop" },
    ]);
  });

  it("can't be broken out of its script tag by a product name", () => {
    expect(serialiseJsonLd({ name: "</script><script>alert(1)</script>" })).not.toContain("</script>");
  });
});
