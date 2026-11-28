# SEO, Sitemap, Robots.txt, and Canonical URLs

This document explains how **OpenSourceMate** manages search engine indexing, `sitemap.xml`, `robots.txt`, and canonical URLs.

---

## 1. Public Static Pages & `sitemap.xml`

`frontend/app/sitemap.ts` generates `/sitemap.xml` using Next.js App Router's built-in `MetadataRoute.Sitemap` support.

All public static routes are defined in a single source of truth in `frontend/utils/seo.ts`:

```ts
export const PUBLIC_STATIC_ROUTES: PublicStaticRoute[] = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/compare", changeFrequency: "weekly", priority: 0.8 },
  { path: "/contribute", changeFrequency: "weekly", priority: 0.8 },
  { path: "/privacy", changeFrequency: "monthly", priority: 0.5 },
];
```

### How to Add a New Public Page to the Sitemap

1. Create the new route under `frontend/app/<your-route>/page.tsx` (and `layout.tsx` if the page is a client component).
2. Add `alternates: { canonical: "/<your-route>" }` to the route's exported `metadata` (or use `buildPageMetadata` from `frontend/utils/seo.ts`).
3. Append `{ path: "/<your-route>", changeFrequency: "weekly", priority: 0.8 }` to `PUBLIC_STATIC_ROUTES` in `frontend/utils/seo.ts`.
4. Run `npm --prefix frontend test -- __tests__/seoSitemapRobots.test.ts` to verify the updated sitemap.

---

## 2. `robots.txt` Configuration

`frontend/app/robots.ts` generates `/robots.txt` using `MetadataRoute.Robots`:

- **Allowed**: `/` (all public static pages)
- **Disallowed**:
  - `/api/` (backend/proxy API routes)
  - `/u/` (dynamic per-username result pages)
- **Sitemap Reference**: `${siteUrl}/sitemap.xml`

---

## 3. Canonical URLs & User Result Page Indexing Decision

- **Canonical URLs**: Every public static page sets `alternates.canonical` in its Next.js `Metadata` (resolved against `metadataBase` in `frontend/app/layout.tsx`) so query-string variants do not split search ranking.
- **User Result Pages (`/u/[username]`)**: Individual developer analysis pages (`frontend/app/u/[username]/page.tsx`) are intentionally **not indexed** by search engines (`robots: { index: false, follow: false }` in `generateMetadata`, plus `Disallow: /u/` in `robots.txt`), while still providing canonical tags and Open Graph / Twitter cards for link sharing.
