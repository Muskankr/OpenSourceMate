# Footer Build Version & Git Commit Display Guide (Issue #188)

## Overview

Issue **#188** introduces build transparency by displaying the deployed Git commit SHA in the footer of all application pages.

When deployed to hosting platforms such as Vercel, the environment variable `VERCEL_GIT_COMMIT_SHA` or `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA` is read at build time. The UI exposes the first 7 characters (the standard short commit SHA), linking directly to that commit on GitHub (`https://github.com/Muskankr/OpenSourceMate/commit/<sha>`). When running in local development, it displays `"dev"`.

---

## 1. Resolution Logic (`utils/buildVersion.ts`)

The helper inspects multiple standard environment variables in priority order:
1. `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA`
2. `VERCEL_GIT_COMMIT_SHA`
3. `NEXT_PUBLIC_GIT_COMMIT_SHA`
4. `GIT_COMMIT_SHA`

```typescript
export function getBuildVersionInfo(): BuildVersionInfo {
  const commitSha = getBuildCommitSha();
  const repositoryUrl = process.env.NEXT_PUBLIC_GITHUB_REPO_URL || "https://github.com/Muskankr/OpenSourceMate";

  if (commitSha) {
    const shortSha = commitSha.substring(0, 7);
    return {
      commitSha,
      shortSha,
      isDev: false,
      commitUrl: `${repositoryUrl}/commit/${commitSha}`,
      buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || null,
      repositoryUrl,
    };
  }

  return {
    commitSha: null,
    shortSha: "dev",
    isDev: true,
    commitUrl: null,
    buildTime: null,
    repositoryUrl,
  };
}
```

---

## 2. Component Design (`components/BuildVersionBadge.tsx`)

The component is rendered in the global footer on both the root page (`app/page.tsx`) and the comparison tool (`app/compare/page.tsx`):

- **Local Development**:
  Renders a static pill badge: `build: dev`.
- **Production Deployment**:
  Renders an accessible interactive link: `build: 7df1e7c ↗`, linking to `https://github.com/Muskankr/OpenSourceMate/commit/7df1e7c...`.
- **Theme Awareness**:
  Adapts contrast for dark mode (`bg-purple-950/40 text-purple-300`) and light mode (`bg-purple-100 text-purple-700`).

---

## 3. Benefits for Triaging & Deployment Debugging

- **Instant Bug Verification**: When users or contributors report an issue on GitHub, maintainers can instantly identify the exact commit the live preview was generated from.
- **Cache Invalidation Diagnosis**: Quickly spot whether CDN caches or Edge functions are serving stale assets or prior releases.
- **Zero Runtime Overhead**: The version information is resolved synchronously with zero network requests.

---

## 4. Testing & Verification

Automated unit tests in `frontend/__tests__/buildVersion.test.tsx`:
- Tests fallback to `"dev"` when environment variables are omitted.
- Tests truncation to 7 characters and construction of the GitHub commit URL when a full 40-character SHA is provided.
- Tests component rendering in both dark and light modes.


## 5. Environment Configuration

To test or override in deployment pipelines, populate `.env.local` or host dashboard:
```env
# Optional: Injected automatically by Vercel on git push
VERCEL_GIT_COMMIT_SHA=4f258de1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7

# Optional: Custom repository URL override
NEXT_PUBLIC_GITHUB_REPO_URL=https://github.com/Muskankr/OpenSourceMate
```

## 6. Implementation Checklist

- [x] Create `frontend/utils/buildVersion.ts` to inspect commit SHA variables and build URLs.
- [x] Create accessible `BuildVersionBadge` component with commit link and fallback styling.
- [x] Add badge to footer on home page (`app/page.tsx`).
- [x] Add badge to footer on compare page (`app/compare/page.tsx`).
- [x] Add comprehensive unit test suite in `frontend/__tests__/buildVersion.test.tsx`.
- [x] Verify badge presentation in dark and light modes.
