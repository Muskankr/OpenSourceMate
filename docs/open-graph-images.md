# Open Graph & Large Twitter Card Guide (Issue #180)

## Overview

Issue **#180** resolves link preview deficits across social networks, chat apps (Slack, Discord, Telegram, WhatsApp), and search engines by generating a dedicated 1200x630 pixel Open Graph banner and switching Twitter card metadata from `summary` to `summary_large_image`.

---

## 1. Dynamic Open Graph Image Generator (`app/opengraph-image.tsx`)

Next.js App Router natively supports programmatic Edge-rendered social images via `@vercel/og` / `next/og`.

- **File**: `frontend/app/opengraph-image.tsx`
- **Resolution**: 1200 x 630 pixels (standard 1.91:1 ratio)
- **Format**: PNG (`image/png`)
- **Runtime**: `edge`
- **Design Elements**:
  - OpenSourceMate glowing logo icon and purple pill tag.
  - High-contrast gradient headline: *"Find Open-Source Issues That Fit Your Skills"*.
  - Clear tagline detailing GitHub profile analysis and issue matching.
  - Distinct capability chips: *Developer Analysis*, *Issue Matcher*, *Profile Comparison*.
  - Dark mode radial backdrop (`#05070d`) matching the application aesthetic.

---

## 2. Large Twitter Card Generator (`app/twitter-image.tsx`)

- **File**: `frontend/app/twitter-image.tsx`
- Re-exports the 1200x630 banner with `summary_large_image` dimensions, ensuring Twitter / X displays prominent full-width card previews instead of small square thumbnails.

---

## 3. Metadata Configuration (`app/layout.tsx`)

```typescript
export const metadata: Metadata = {
  // ...
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    siteName: "OpenSourceMate",
    url: siteUrl,
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: siteTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: "/twitter-image",
        width: 1200,
        height: 630,
        alt: siteTitle,
      },
    ],
  },
};
```

---

## 4. Verification with Card Validators

When testing URLs with card validators (Twitter Card Validator, Facebook Sharing Debugger, LinkedIn Post Inspector, OpenGraph.xyz):
1. Card type renders as `summary_large_image`.
2. Image dimension is validated at `1200 x 630`.
3. Alternative text (`alt`) is populated for accessibility.


## 5. Testing & Validation Checklist

- [x] Create programmatic 1200x630 Open Graph image generator in `app/opengraph-image.tsx`.
- [x] Create Twitter card image handler in `app/twitter-image.tsx`.
- [x] Configure `summary_large_image` on root metadata.
- [x] Add alternative text, mime-type, and resolution metadata.
- [x] Add unit tests in `frontend/__tests__/openGraphImage.test.ts`.
- [x] Validate aspect ratio with standard social network debuggers.

---

## 6. Dynamic User Profile Open Graph Image (Issue #479)

When sharing developer-specific result links (`/u/[username]`), a personalized 1200x630 Open Graph preview is dynamically rendered.

### Capabilities & Specifications
- **Routes**:
  - Open Graph: `/u/[username]/opengraph-image` (`frontend/app/u/[username]/opengraph-image.tsx`)
  - Twitter Card: `/u/[username]/twitter-image` (`frontend/app/u/[username]/twitter-image.tsx`)
- **Card Format**: `summary_large_image` (1200 x 630 pixels, PNG, `edge` runtime)
- **Visual Elements**:
  - OpenSourceMate brand pill and header.
  - Large avatar circle highlighting the developer's initial letter.
  - Clean `@username` heading.
  - Top 3 analyzed technical skills rendered as glowing pill badges.
- **Cached Analysis Data Only**:
  - Uses cached skills analysis (`next: { revalidate: 3600 }`) with a fast timeout (2.5s).
  - Never forces a refresh, avoiding rate limit exhaustion.
- **Resilience & Fallback Rules**:
  - If a user is unknown (404), rate-limited (429), or has an invalid username, it renders the fallback default OpenSourceMate branding banner.
  - Result page metadata (`generateMetadata` in `frontend/app/u/[username]/page.tsx`) defaults to `/opengraph-image` and `/twitter-image` for invalid usernames.
- **Security & Caching**:
  - Dynamic user and skill texts are escaped (`escapeText`) to prevent layout breakage or XSS.
  - Responses carry `Cache-Control: public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400`.


