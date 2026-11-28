import type { MetadataRoute } from "next";
import { getSiteUrl } from "../utils/seo";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/u/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
