import type { MetadataRoute } from "next";
import { SITE_URL as BASE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      /* Nothing personal or transactional should be indexed. */
      disallow: ["/account", "/account/", "/cart", "/checkout", "/login", "/register", "/forgot-password"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
