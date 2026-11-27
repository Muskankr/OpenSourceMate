/**
 * Metadata configuration helper and SEO utilities for OpenSourceMate routes.
 */

import type { Metadata } from "next";

export interface PageMetadataConfig {
  title: string;
  description: string;
  path: string;
  ogType?: "website" | "article";
  image?: string;
  noIndex?: boolean;
}

const DEFAULT_SITE_TITLE = "OpenSourceMate – Find open-source issues that fit your skills";
const DEFAULT_SITE_URL = "https://open-source-mate-tawny.vercel.app";

export interface PublicStaticRoute {
  path: string;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
}

/**
 * Single source of truth for public static pages included in sitemap.xml.
 * Add new public static routes here so they are automatically included in the sitemap.
 */
export const PUBLIC_STATIC_ROUTES: PublicStaticRoute[] = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/compare", changeFrequency: "weekly", priority: 0.8 },
  { path: "/contribute", changeFrequency: "weekly", priority: 0.8 },
  { path: "/privacy", changeFrequency: "monthly", priority: 0.5 },
];

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, "");
}

/**
 * Constructs a fully normalized Next.js Metadata object adhering to root title templates.
 */
export function buildPageMetadata(config: PageMetadataConfig): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;
  const canonicalUrl = config.path.startsWith("/") ? config.path : `/${config.path}`;
  const fullUrl = `${siteUrl.replace(/\/$/, "")}${canonicalUrl}`;
  const fullTitle = `${config.title} | OpenSourceMate`;

  return {
    title: config.title,
    description: config.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: fullTitle,
      description: config.description,
      url: canonicalUrl,
      type: config.ogType || "website",
      siteName: "OpenSourceMate",
      ...(config.image
        ? {
            images: [
              {
                url: config.image,
                width: 1200,
                height: 630,
                alt: config.title,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: config.description,
      ...(config.image ? { images: [config.image] } : {}),
    },
    robots: config.noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
  };
}

/**
 * Resolves a title template string like '%s | OpenSourceMate' with a target route title.
 */
export function formatDocumentTitle(pageTitle?: string | null): string {
  if (!pageTitle || !pageTitle.trim()) {
    return DEFAULT_SITE_TITLE;
  }
  return `${pageTitle.trim()} | OpenSourceMate`;
}
