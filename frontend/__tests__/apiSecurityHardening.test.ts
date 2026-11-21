import { ApiClientError } from "../utils/apiClient";
import { buildContentSecurityPolicy, buildSecurityHeaders } from "../utils/securityHeaders";

describe("Frontend API Client & Security Hardening", () => {
  describe("API Client Error Handling for Rate Limiting & Input Validation", () => {
    it("constructs ApiClientError with 400 Bad Request status and unified error details", () => {
      const error = new ApiClientError(
        "Invalid GitHub username '-invalid-'. GitHub usernames must be 1-39 characters.",
        400,
        "INVALID_USERNAME",
        undefined,
        { username: "-invalid-" }
      );

      expect(error.status).toBe(400);
      expect(error.code).toBe("INVALID_USERNAME");
      expect(error.message).toContain("Invalid GitHub username");
      expect(error.details).toEqual({ username: "-invalid-" });
    });

    it("constructs ApiClientError with 429 Rate Limit and parses reset timestamp or retryAfter", () => {
      const resetDate = new Date(Date.now() + 60 * 1000).toISOString();
      const error = new ApiClientError(
        "Too many requests to analysis endpoints. Please slow down and try again.",
        429,
        "IP_RATE_LIMIT_EXCEEDED",
        resetDate,
        { retry_after_seconds: 60 }
      );

      expect(error.status).toBe(429);
      expect(error.code).toBe("IP_RATE_LIMIT_EXCEEDED");
      expect(error.resetAt).toBe(resetDate);
      expect(error.details).toEqual({ retry_after_seconds: 60 });
      expect(error.message).toContain("Too many requests");
    });
  });

  describe("Security Headers Verification", () => {
    it("includes standard anti-framing, nosniff, and strict CSP policies", () => {
      const headers = Object.fromEntries(
        buildSecurityHeaders({ apiUrl: "http://localhost:8000", isDev: false }).map((h) => [
          h.key,
          h.value,
        ])
      );

      expect(headers["X-Content-Type-Options"]).toBe("nosniff");
      expect(headers["X-Frame-Options"]).toBe("DENY");
      expect(headers["Cross-Origin-Opener-Policy"]).toBe("same-origin");
      expect(headers["Content-Security-Policy"]).toContain("default-src 'self'");
      expect(headers["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
      expect(headers["Strict-Transport-Security"]).toBeDefined();
    });

    it("connect-src allows configured FastAPI backend origin", () => {
      const policy = buildContentSecurityPolicy({
        apiUrl: "https://api.my-configured-domain.com",
      });

      expect(policy).toContain("https://api.my-configured-domain.com");
      expect(policy).toContain("https://api.github.com");
    });
  });
});
