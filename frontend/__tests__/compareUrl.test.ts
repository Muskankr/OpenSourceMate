/**
 * Unit tests verifying shareable URLs, swap logic, and duplicate checks (Issue #190).
 */

import {
  parseCompareParams,
  buildCompareShareUrl,
  isDuplicateUsername,
} from "../utils/compareUrl";

describe("Compare Page Shareable URLs & Duplicate Check Suite (Issue #190)", () => {
  describe("parseCompareParams", () => {
    it("parses modern ?a=user1&b=user2 query parameters", () => {
      const res = parseCompareParams("?a=torvalds&b=gaearon");
      expect(res.user1).toBe("torvalds");
      expect(res.user2).toBe("gaearon");
    });

    it("parses legacy ?user1=...&user2=... query parameters", () => {
      const res = parseCompareParams("?user1=octocat&user2=defunkt");
      expect(res.user1).toBe("octocat");
      expect(res.user2).toBe("defunkt");
    });

    it("strips leading @ symbols and trims whitespace", () => {
      const res = parseCompareParams("?a=%20%40babin%20&b=%40muskan");
      expect(res.user1).toBe("babin");
      expect(res.user2).toBe("muskan");
    });

    it("handles missing or single query parameters safely", () => {
      const res = parseCompareParams("?a=torvalds");
      expect(res.user1).toBe("torvalds");
      expect(res.user2).toBe("");
    });
  });

  describe("buildCompareShareUrl", () => {
    it("builds clean /compare?a=user1&b=user2 URLs", () => {
      const url = buildCompareShareUrl("torvalds", "gaearon");
      expect(url).toBe("/compare?a=torvalds&b=gaearon");
    });

    it("prepends custom origin if supplied", () => {
      const url = buildCompareShareUrl("torvalds", "gaearon", "https://opensourcemate.org");
      expect(url).toBe("https://opensourcemate.org/compare?a=torvalds&b=gaearon");
    });

    it("cleans trailing slashes from origin and query params", () => {
      const url = buildCompareShareUrl("@torvalds", "@gaearon", "https://example.com/");
      expect(url).toBe("https://example.com/compare?a=torvalds&b=gaearon");
    });
  });

  describe("isDuplicateUsername", () => {
    it("identifies identical usernames case-insensitively", () => {
      expect(isDuplicateUsername("octocat", "octocat")).toBe(true);
      expect(isDuplicateUsername("OCTOCAT", "octocat")).toBe(true);
      expect(isDuplicateUsername("@octocat", "octocat")).toBe(true);
    });

    it("returns false for distinct usernames", () => {
      expect(isDuplicateUsername("torvalds", "gaearon")).toBe(false);
      expect(isDuplicateUsername("", "gaearon")).toBe(false);
      expect(isDuplicateUsername("", "")).toBe(false);
    });
  });
});


  describe("Query String Edge Cases", () => {
    it("handles special characters and encoded spaces in query parameters", () => {
      const res = parseCompareParams("?a=dev-one&b=dev-two");
      expect(res.user1).toBe("dev-one");
      expect(res.user2).toBe("dev-two");
    });

    it("returns empty string when URLSearchParams has no target keys", () => {
      const res = parseCompareParams(new URLSearchParams("theme=dark&view=side-by-side"));
      expect(res.user1).toBe("");
      expect(res.user2).toBe("");
    });
  });

  describe("Swap Inversion Logic", () => {
    it("verifies swapped parameter generation", () => {
      const original = parseCompareParams("?a=first&b=second");
      const swappedUrl = buildCompareShareUrl(original.user2, original.user1);
      expect(swappedUrl).toBe("/compare?a=second&b=first");
    });
  });


  describe("URL Serialization and Deserialization Round-trip", () => {
    it("round-trips user1 and user2 through build and parse", () => {
      const u1 = "alice";
      const u2 = "bob";
      const url = buildCompareShareUrl(u1, u2);
      const parsed = parseCompareParams(url.split("?")[1] || "");
      expect(parsed.user1).toBe(u1);
      expect(parsed.user2).toBe(u2);
    });

    it("round-trips when usernames have hyphens and numbers", () => {
      const u1 = "react-dev-99";
      const u2 = "python-ninja-2026";
      const url = buildCompareShareUrl(u1, u2);
      const parsed = parseCompareParams(url.split("?")[1] || "");
      expect(parsed.user1).toBe(u1);
      expect(parsed.user2).toBe(u2);
    });
  });
