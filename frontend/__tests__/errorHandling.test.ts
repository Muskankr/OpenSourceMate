import {
  isNetworkOrServerError,
  sanitizeErrorMessage,
  getReportIssueUrl,
  resolveServiceErrorDetails,
  GITHUB_ISSUES_URL,
} from "../utils/errorHandling";
import { ApiClientError } from "../utils/apiClient";

describe("errorHandling utilities (Issue #128)", () => {
  describe("isNetworkOrServerError", () => {
    it("returns true for 5xx HTTP numbers", () => {
      expect(isNetworkOrServerError(500)).toBe(true);
      expect(isNetworkOrServerError(502)).toBe(true);
      expect(isNetworkOrServerError(503)).toBe(true);
      expect(isNetworkOrServerError(504)).toBe(true);
    });

    it("returns false for 4xx client error numbers", () => {
      expect(isNetworkOrServerError(400)).toBe(false);
      expect(isNetworkOrServerError(404)).toBe(false);
      expect(isNetworkOrServerError(422)).toBe(false);
      expect(isNetworkOrServerError(429)).toBe(false);
    });

    it("returns true for TypeError (standard Fetch network drops)", () => {
      expect(isNetworkOrServerError(new TypeError("Failed to fetch"))).toBe(true);
      expect(isNetworkOrServerError(new TypeError("Network request failed"))).toBe(true);
    });

    it("returns true for ApiClientError with status 0 or 5xx", () => {
      const netErr = new ApiClientError("Network error", 0, "NETWORK_ERROR");
      expect(isNetworkOrServerError(netErr)).toBe(true);

      const srvErr = new ApiClientError("Server error", 503, "SERVICE_UNAVAILABLE");
      expect(isNetworkOrServerError(srvErr)).toBe(true);

      const notFoundErr = new ApiClientError("Not found", 404, "NOT_FOUND");
      expect(isNetworkOrServerError(notFoundErr)).toBe(false);
    });

    it("returns true for objects with connection refused messages", () => {
      expect(isNetworkOrServerError({ message: "connect ECONNREFUSED 127.0.0.1:8000" })).toBe(true);
      expect(isNetworkOrServerError({ code: "ECONNREFUSED" })).toBe(true);
    });

    it("returns false for null, undefined, or abort errors", () => {
      expect(isNetworkOrServerError(null)).toBe(false);
      expect(isNetworkOrServerError(undefined)).toBe(false);

      const abortError = new DOMException("The user aborted a request.", "AbortError");
      expect(isNetworkOrServerError(abortError)).toBe(false);
    });
  });

  describe("sanitizeErrorMessage", () => {
    it("strips Python traceback and stack trace indicators", () => {
      const traceback = `Traceback (most recent call last):
  File "app/main.py", line 42, in get_user
    raise ConnectionRefusedError()
ConnectionRefusedError: [Errno 111] Connection refused`;

      const sanitized = sanitizeErrorMessage(traceback);
      expect(sanitized).not.toContain("Traceback");
      expect(sanitized).not.toContain("ConnectionRefusedError");
      expect(sanitized).toBe(
        "The backend service is currently unreachable. Please ensure the backend server is running and try again."
      );
    });

    it("strips JavaScript V8 stack traces and file paths", () => {
      const jsStack = `TypeError: Failed to fetch
    at typedRequest (http://localhost:3000/_next/static/chunks/app/page.js:123:45)
    at async analyzeProfile (http://localhost:3000/_next/static/chunks/app/page.js:456:78)`;

      const sanitized = sanitizeErrorMessage(jsStack);
      expect(sanitized).not.toContain("at typedRequest");
      expect(sanitized).not.toContain("_next");
    });

    it("returns clean user-friendly messages untouched", () => {
      const clean = "GitHub user 'testuser' could not be found. Please check the spelling.";
      expect(sanitizeErrorMessage(clean)).toBe(clean);
    });

    it("provides fallback message when error is empty or null", () => {
      expect(sanitizeErrorMessage(null, "Custom fallback")).toBe("Custom fallback");
      expect(sanitizeErrorMessage(undefined)).toBe(
        "An unexpected error occurred. Please try again."
      );
    });
  });

  describe("getReportIssueUrl", () => {
    it("generates a URL pointing to GitHub Issues with bug label and safe body", () => {
      const url = getReportIssueUrl({
        statusCode: 503,
        endpoint: "/api/github/users/octocat",
      });

      expect(url).toContain(GITHUB_ISSUES_URL);
      expect(url).toContain("labels=bug");
      expect(url).toContain(encodeURIComponent("[Bug]: Service Unavailable (HTTP 503)"));
      expect(url).toContain(encodeURIComponent("### Description"));
    });

    it("handles missing status code gracefully", () => {
      const url = getReportIssueUrl();
      expect(url).toContain(encodeURIComponent("[Bug]: Backend Service Unavailable / Cannot connect"));
    });
  });

  describe("resolveServiceErrorDetails", () => {
    it("resolves 503 status into maintenance title and message", () => {
      const details = resolveServiceErrorDetails(503);
      expect(details.isServiceUnavailable).toBe(true);
      expect(details.statusCode).toBe(503);
      expect(details.title).toBe("Service Temporarily Unavailable");
      expect(details.message).toContain("temporarily unavailable or undergoing maintenance");
      expect(details.canRetry).toBe(true);
      expect(details.reportUrl).toContain(GITHUB_ISSUES_URL);
    });

    it("resolves 500 status into backend service error", () => {
      const details = resolveServiceErrorDetails(500);
      expect(details.isServiceUnavailable).toBe(true);
      expect(details.title).toBe("Backend Service Error");
      expect(details.message).toContain("unexpected server error occurred");
    });

    it("resolves network TypeError into connection failure details", () => {
      const details = resolveServiceErrorDetails(new TypeError("Failed to fetch"));
      expect(details.isServiceUnavailable).toBe(true);
      expect(details.title).toBe("Unable to Connect to Server");
      expect(details.message).toContain("Unable to establish a connection to the OpenSourceMate backend");
    });
  });
});

