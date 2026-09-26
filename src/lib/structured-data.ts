import type { Product } from "@/lib/products";

/*
 * schema.org JSON-LD for search engines (Next docs: guides/json-ld). Pure, so
 * the shape can be tested; <JsonLd> renders it.
 *
 * Only facts the page itself states: the price is the pre-GST price the page
 * shows, marked as excluding tax, and there's no rating unless real reviews
 * exist (a made-up AggregateRating is a Google penalty as well as a lie).
 */

type Json = Record<string, unknown>;

/* "39900" paise → "399.00": schema.org wants a decimal string, never a float. */
export function decimalPrice(minor: number): string {
  return `${Math.trunc(minor / 100)}.${String(Math.abs(minor % 100)).padStart(2, "0")}`;
}

export function productJsonLd(product: Product, siteUrl: string): Json {
  const url = `${siteUrl}/shop/${product.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.slug.toUpperCase(),
    url,
    ...(product.description ? { description: product.description } : {}),
    ...(product.images.length ? { image: product.images } : {}),
    brand: { "@type": "Brand", name: "Berozgar" },
    category: product.categoryName,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "INR",
      price: decimalPrice(product.priceMinor),
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: decimalPrice(product.priceMinor),
        priceCurrency: "INR",
        valueAddedTaxIncluded: false,
      },
      availability: product.soldout ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
}

export function breadcrumbJsonLd(trail: [name: string, path: string][], siteUrl: string): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: `${siteUrl}${path}`,
    })),
  };
}

export function siteJsonLd(siteUrl: string): Json[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Berozgar",
      url: siteUrl,
      logo: `${siteUrl}/opengraph-image`,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Berozgar",
      url: siteUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/search?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ];
}

/* JSON for a <script> body: "<" escaped so a product name can't close the tag. */
export function serialiseJsonLd(data: Json | Json[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
