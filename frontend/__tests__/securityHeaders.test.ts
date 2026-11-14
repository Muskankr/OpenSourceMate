import { buildContentSecurityPolicy, buildSecurityHeaders } from "@/utils/securityHeaders";

function directive(policy: string, name: string): string[] {
  const entry = policy.split("; ").find((part) => part.startsWith(`${name} `) || part === name);
  return entry ? entry.split(" ").slice(1) : [];
}

describe("security headers", () => {
  it("sends the expected headers in production", () => {
    const headers = Object.fromEntries(
      buildSecurityHeaders({ apiUrl: "https://api.example.com" }).map((h) => [h.key, h.value])
    );
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Permissions-Policy"]).toContain("camera=()");
    expect(headers["Strict-Transport-Security"]).toContain("max-age=63072000");
    expect(headers["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
  });

  it("allows the backend API origin and GitHub", () => {
    const policy = buildContentSecurityPolicy({ apiUrl: "https://api.example.com/some/path" });
    expect(directive(policy, "connect-src")).toEqual(
      expect.arrayContaining(["'self'", "https://api.example.com", "https://api.github.com"])
    );
    expect(directive(policy, "img-src")).toContain("https://avatars.githubusercontent.com");
  });

  it("falls back to the local backend when the API URL is missing or invalid", () => {
    expect(directive(buildContentSecurityPolicy(), "connect-src")).toContain(
      "http://localhost:8000"
    );
    expect(directive(buildContentSecurityPolicy({ apiUrl: "not a url" }), "connect-src")).toContain(
      "http://localhost:8000"
    );
  });

  it("only allows eval, websockets and plain HTTP in development", () => {
    const prod = buildContentSecurityPolicy();
    expect(directive(prod, "script-src")).not.toContain("'unsafe-eval'");
    expect(prod).toContain("upgrade-insecure-requests");

    const dev = buildContentSecurityPolicy({ isDev: true });
    expect(directive(dev, "script-src")).toContain("'unsafe-eval'");
    expect(directive(dev, "connect-src")).toContain("ws:");
    expect(dev).not.toContain("upgrade-insecure-requests");
    expect(buildSecurityHeaders({ isDev: true }).map((h) => h.key)).not.toContain(
      "Strict-Transport-Security"
    );
  });

  it("allows the Vercel toolbar only on preview deployments", () => {
    expect(buildContentSecurityPolicy()).not.toContain("vercel.live");
    expect(directive(buildContentSecurityPolicy({ isVercelPreview: true }), "frame-src")).toEqual([
      "https://vercel.live",
    ]);
  });
});
