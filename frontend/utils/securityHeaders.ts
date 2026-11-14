/**
 * Security headers sent with every page (Issue #262).
 * Used by next.config.ts. See docs/security-headers.md for what each header does.
 */

export interface SecurityHeaderOptions {
  /** Base URL of the FastAPI backend (NEXT_PUBLIC_API_URL). */
  apiUrl?: string;
  /** `next dev` needs eval for fast refresh and a websocket for hot reload. */
  isDev?: boolean;
  /** Vercel preview deployments load the Vercel toolbar from vercel.live. */
  isVercelPreview?: boolean;
}

const DEFAULT_API_URL = "http://localhost:8000";
const GITHUB_IMAGE_HOSTS = [
  "https://avatars.githubusercontent.com",
  "https://raw.githubusercontent.com",
];
// The contribute page reads open issues straight from the GitHub REST API.
const GITHUB_API = "https://api.github.com";
const VERCEL_LIVE = "https://vercel.live";

function originOf(url: string | undefined): string {
  try {
    return new URL(url || DEFAULT_API_URL).origin;
  } catch {
    return new URL(DEFAULT_API_URL).origin;
  }
}

export function buildContentSecurityPolicy({
  apiUrl,
  isDev = false,
  isVercelPreview = false,
}: SecurityHeaderOptions = {}): string {
  const preview = isVercelPreview ? [VERCEL_LIVE] : [];
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // Next.js inlines small scripts for hydration, so 'unsafe-inline' is needed without nonces.
    "script-src": ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : []), ...preview],
    "style-src": ["'self'", "'unsafe-inline'", ...preview],
    "img-src": ["'self'", "data:", "blob:", ...GITHUB_IMAGE_HOSTS, ...preview],
    // next/font self-hosts the Geist fonts, so no font CDN is needed.
    "font-src": ["'self'", "data:", ...preview],
    "connect-src": [
      "'self'",
      originOf(apiUrl),
      GITHUB_API,
      ...(isDev ? ["ws:", "wss:"] : []),
      ...preview,
    ],
    // The mock API (MSW) registers a service worker from the same origin.
    "worker-src": ["'self'", "blob:"],
    "frame-src": isVercelPreview ? [VERCEL_LIVE] : ["'none'"],
    "frame-ancestors": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
  };

  const policy = Object.entries(directives).map(
    ([name, sources]) => `${name} ${Array.from(new Set(sources)).join(" ")}`
  );
  if (!isDev) {
    policy.push("upgrade-insecure-requests");
  }
  return policy.join("; ");
}

export function buildSecurityHeaders(
  options: SecurityHeaderOptions = {}
): { key: string; value: string }[] {
  const headers = [
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy(options) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
    },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ];
  if (!options.isDev) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains",
    });
  }
  return headers;
}
