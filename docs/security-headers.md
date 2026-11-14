# Security headers

The frontend and the backend send HTTP security headers on every response (#262). This page lists each
header, why it is there and how to check it.

## Frontend (Next.js)

The headers are built in [`frontend/utils/securityHeaders.ts`](../frontend/utils/securityHeaders.ts) and
added for every path by `headers()` in [`frontend/next.config.ts`](../frontend/next.config.ts).

| Header                       | Value                                                                              | Why                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `Content-Security-Policy`    | See below                                                                          | Limits where scripts, styles, images and requests can come from.                  |
| `X-Content-Type-Options`     | `nosniff`                                                                          | Stops browsers from guessing a file's type, so a text file can't run as a script. |
| `Referrer-Policy`            | `strict-origin-when-cross-origin`                                                  | Other sites see only our origin, never full URLs such as `/u/<username>`.         |
| `Permissions-Policy`         | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()` | Turns off browser features the app never uses.                                    |
| `X-Frame-Options`            | `DENY`                                                                             | Stops other sites from framing the app (clickjacking). Older browsers only.       |
| `Cross-Origin-Opener-Policy` | `same-origin`                                                                      | Isolates the window from pages it opens or that open it.                          |
| `Strict-Transport-Security`  | `max-age=63072000; includeSubDomains`                                              | Browsers only use HTTPS for two years. Production builds only.                    |

### Content-Security-Policy

| Directive                   | Sources                                                                 | Needed for                                                                               |
| --------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `default-src`               | `'self'`                                                                | Everything not listed below.                                                             |
| `script-src`                | `'self' 'unsafe-inline'`                                                | Next.js inline hydration scripts. See trade-off below.                                   |
| `style-src`                 | `'self' 'unsafe-inline'`                                                | Tailwind output and inline `style` attributes.                                           |
| `img-src`                   | `'self' data: blob:` and GitHub image hosts                             | Avatars and images from `avatars.githubusercontent.com` and `raw.githubusercontent.com`. |
| `font-src`                  | `'self' data:`                                                          | Geist fonts, which `next/font` serves from our own origin.                               |
| `connect-src`               | `'self'`, the origin of `NEXT_PUBLIC_API_URL`, `https://api.github.com` | Backend API calls, and the contribute page reading GitHub issues.                        |
| `worker-src`                | `'self' blob:`                                                          | The mock API (MSW) service worker.                                                       |
| `frame-src`                 | `'none'`                                                                | The app embeds no frames.                                                                |
| `frame-ancestors`           | `'none'`                                                                | Nobody can frame the app (modern replacement for `X-Frame-Options`).                     |
| `object-src`                | `'none'`                                                                | No plugins.                                                                              |
| `base-uri`, `form-action`   | `'self'`                                                                | Stops injected `<base>` tags and forms that post elsewhere.                              |
| `upgrade-insecure-requests` | (production only)                                                       | Loads any `http://` subresource over HTTPS.                                              |

Some sources depend on the environment:

- **`next dev`** adds `'unsafe-eval'` to `script-src` (React needs it for error stacks in development) and
  `ws: wss:` to `connect-src` (hot reload). It drops HSTS and `upgrade-insecure-requests` so
  `http://localhost` keeps working.
- **Vercel preview deployments** (`VERCEL_ENV=preview`) allow `https://vercel.live` so the Vercel toolbar
  loads.

**`NEXT_PUBLIC_API_URL` is read at build time.** If you change the backend URL, rebuild the frontend,
otherwise API calls are blocked by `connect-src`.

**Trade-off: `'unsafe-inline'` in `script-src`.** Next.js puts small inline scripts in every page. Allowing
them without `'unsafe-inline'` needs a nonce per request, which makes every page render dynamically (see
the "Without Nonces" section of the Next.js CSP guide). We keep static rendering and use the guide's
no-nonce policy. Scanners may mark this as a warning. Other directives still block scripts from other
origins, plugins and framing.

## Backend (FastAPI)

The backend uses FastAPI, not Django. The middleware in
[`backend/app/middleware/security_headers.py`](../backend/app/middleware/security_headers.py) adds the
headers to every response, including errors and rate-limit responses. Settings come from environment
variables (see [`backend/.env.example`](../backend/.env.example)).

| Header                       | Value                                           | Setting                                                                                                         |
| ---------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `X-Content-Type-Options`     | `nosniff`                                       | Always on.                                                                                                      |
| `X-Frame-Options`            | `DENY`                                          | Always on.                                                                                                      |
| `Cross-Origin-Opener-Policy` | `same-origin`                                   | Always on.                                                                                                      |
| `Referrer-Policy`            | `no-referrer`                                   | `SECURITY_REFERRER_POLICY`                                                                                      |
| `Content-Security-Policy`    | `default-src 'none'; frame-ancestors 'none'`    | Always on. `/docs` and `/redoc` only get `frame-ancestors 'none'` because Swagger UI and ReDoc load from a CDN. |
| `Strict-Transport-Security`  | `max-age=31536000` in production, off otherwise | `SECURITY_HSTS_SECONDS`, `SECURITY_HSTS_INCLUDE_SUBDOMAINS`, `SECURITY_HSTS_PRELOAD`                            |

Set `SECURITY_HEADERS_ENABLED=false` to turn the middleware off, for example behind a proxy that already
adds these headers.

**Cookies:** the API does not set any cookies, so there are no cookie flags to configure. If a future
feature adds cookies, set them with `secure=True`, `httponly=True` and `samesite="lax"`.

## How to test

**Automated tests**

```bash
cd backend && pytest tests/test_security_headers.py
cd frontend && npx jest __tests__/securityHeaders.test.ts
```

**Locally**

```bash
curl -sI http://localhost:3000/ | grep -iE "content-security|x-content|referrer|permissions|x-frame|cross-origin"
curl -sI http://localhost:8000/api/health | grep -iE "content-security|x-content|referrer|x-frame|strict-transport"
```

**On a preview or production deployment**

1. Run the frontend and backend URLs through a header scanner such as
   [Mozilla HTTP Observatory](https://developer.mozilla.org/en-US/observatory) or
   [securityheaders.com](https://securityheaders.com). Expect no high-severity findings. The
   `'unsafe-inline'` note above is the expected warning.
2. Open the site with the browser dev tools console open. Analyse a profile, open the compare and
   contribute pages, and switch the theme. There should be no `Content-Security-Policy` errors, and fonts,
   avatars and API results should load.
3. Open `<backend>/docs` and check that Swagger UI still loads.
