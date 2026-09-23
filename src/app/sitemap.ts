import type { MetadataRoute } from "next";
import { getCatalogueOrThrow } from "@/lib/catalogue";
import { categoriesOf } from "@/lib/catalogue-map";
import { articles, looks } from "@/lib/data";
import { SITE_URL as BASE } from "@/lib/site";

const STATIC_ROUTES = [
  "",
  "/shop",
  "/collections",
  "/collections/drop-001",
  "/lookbook",
  "/journal",
  "/about",
  "/manifesto",
  "/collaborations",
  "/search",
  "/track-order",
  "/login",
  "/register",
  "/help",
  "/help/contact",
  "/help/faq",
  "/help/shipping",
  "/help/returns",
  "/help/size-guide",
  "/legal/privacy",
  "/legal/terms",
  "/legal/shipping",
  "/legal/refund",
  "/legal/cancellation",
  "/legal/cookies",
  "/legal/disclaimer",
  "/legal/ip",
  "/legal/grievance",
  "/legal/bulk",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  /* Baked at build: an empty sitemap is what Google would read. */
  const products = await getCatalogueOrThrow();

  return [
    ...categoriesOf(products).map((category) => ({
      url: `${BASE}/collections/${category.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...STATIC_ROUTES.map((route) => ({
      url: `${BASE}${route}`,
      lastModified: now,
      changeFrequency: route === "" ? ("daily" as const) : ("weekly" as const),
      priority: route === "" ? 1 : 0.7,
    })),
    ...products.map((product) => ({
      url: `${BASE}/shop/${product.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...articles.map((article) => ({
      url: `${BASE}/journal/${article.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...looks.map((look) => ({
      url: `${BASE}/lookbook/${look.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
