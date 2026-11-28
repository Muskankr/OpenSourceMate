# Web App Manifest, Theme Colour & Apple Touch Icon (Issue #181)

## Overview

Issue **#181** equips OpenSourceMate with Progressive Web App (PWA) installability fundamentals, scheme-adaptive theme colors, and Apple touch icons for home-screen bookmarking across iOS, Android, and Desktop platforms without requiring a service worker.

---

## 1. Web App Manifest (`app/manifest.ts`)

Next.js generates a valid Web App Manifest served at `/manifest.webmanifest` (or `/manifest.json`):

- **Name**: `OpenSourceMate`
- **Short Name**: `OpenSourceMate`
- **Start URL**: `/`
- **Display**: `standalone` (removes browser chrome when launched from device home screen)
- **Background Color**: `#05070d`
- **Theme Color**: `#7c3aed` (Purple brand hue)
- **Orientation**: `portrait-primary`
- **Categories**: `developer-tools`, `productivity`, `utilities`
- **Icons**:
  - `icon-192.png`: 192x192 maskable icon for Android launch pads.
  - `icon-512.png`: 512x512 splash screen icon.
  - `apple-touch-icon.png`: 180x180 iOS home screen bookmark icon.
- **Shortcuts**: Fast action shortcut directly to the Profile Comparison tool (`/compare`).

---

## 2. Adaptive Theme Color (`app/viewport.ts`)

In Next.js 14 & 15, theme colors and viewport settings are managed via the dedicated `Viewport` export:

```typescript
import type { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#05070d" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "dark light",
};
```

This guarantees browser address bars and OS status bars on mobile devices match the user's active theme:
- Light Mode: Clean `#ffffff` address bar.
- Dark Mode: Immersive `#05070d` address bar.

---

## 3. Apple Touch Icon (`app/layout.tsx` & `public/apple-touch-icon.png`)

Configured under `metadata.icons.apple`:
```typescript
icons: {
  icon: [
    { url: "/image.png" },
    { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
  ],
  shortcut: "/image.png",
  apple: [
    { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  ],
}
```

Produces:
`<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`

---

## 4. Lighthouse PWA Audit Verification

Meets all installability basics verified by Lighthouse:
- [x] Web app manifest specified in `<link rel="manifest">`.
- [x] Provides valid 192x192 and 512x512 PNG icons.
- [x] Configures `theme-color` meta tag responsive to system color schemes.
- [x] Provides valid `apple-touch-icon` for iOS Safari.
- [x] No complex service worker overhead introduced.


## 5. Mobile Homescreen Installation Flow

When users tap "Add to Home Screen" on mobile devices (Safari iOS or Chrome Android):
1. The browser parses `manifest.webmanifest`.
2. The user sees `OpenSourceMate` with the verified high-resolution icon.
3. Upon launch, the app runs in full-screen standalone windowing mode without the browser URL bar, leveraging the dark `#05070d` background during splash initialization.
4. Quick actions (such as "Compare Profiles") appear on long-press of the home screen icon via the configured `shortcuts`.

## 6. Technical Checklist

- [x] Create TypeScript manifest generator `app/manifest.ts` providing compliant PWA attributes.
- [x] Configure dual scheme theme colors (`#ffffff` light, `#05070d` dark) in `app/viewport.ts`.
- [x] Add 192x192, 512x512, and 180x180 PNG icon assets.
- [x] Declare `apple-touch-icon` and `manifest` in root layout metadata.
- [x] Implement comprehensive unit tests in `frontend/__tests__/pwaManifest.test.ts`.


## 7. Service Worker & Offline Caching Architecture

OpenSourceMate includes a dedicated Progressive Web App Service Worker (`public/sw.js`) and offline cache resilience:
- **Application Shell Precaching**: Precaches core static shell assets (`/`, `/manifest.webmanifest`, `/favicon.ico`, `/icon-192.png`, `/icon-512.png`, `/apple-touch-icon.png`) on `install` event with `skipWaiting()`.
- **Cache Invalidation Upon Deployment**: On the `activate` event, the service worker iterates over `caches.keys()` and deletes any cache not matching the current version whitelist (`CURRENT_CACHES`). It immediately claims all active clients using `clients.claim()`.
- **Navigation & API Interception**: Uses a network-first strategy for navigation and `/api/github/users/` and `/api/matching/` endpoints, caching fresh successful results in `osm-data-v*` and falling back to cached responses when offline.
- **Offline Result Auto-Restoration**: When opened offline, OpenSourceMate automatically retrieves and displays the last successfully analyzed profile and recommendations from local offline storage.
- **Offline Banner & Fetched Timestamps**: Features an accessible `OfflineBanner` component (`role="status"`, `aria-live="polite"`) and marks cached results with badges showing the exact timestamp and relative time when data was fetched.


## 8. Browser and Platform Compatibility

| Platform | Feature | Behavior |
| :--- | :--- | :--- |
| **iOS Safari** | `apple-touch-icon.png` (180x180) | Renders high-res home screen app icon with native iOS rounded corners. |
| **Android Chrome** | `icon-192.png` & `icon-512.png` | Activates native Install App banner and generates adaptive maskable app tile. |
| **Desktop Chrome / Edge** | `manifest.webmanifest` | Shows install icon in browser address bar; runs in dedicated OS window. |
| **MacOS / Windows** | `theme-color` light/dark | Adapts window title bar styling to match user system dark/light preference. |


## 9. Verification Instructions

Run unit tests verifying the manifest definition and viewport theme color mappings:
```bash
cd frontend
npm test -- __tests__/pwaManifest.test.ts
```
Expected output: 100% assertions passing.
