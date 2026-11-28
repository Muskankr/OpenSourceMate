/**
 * Unit tests verifying dynamic per-user Open Graph / Twitter image generator
 * and metadata configuration (Issue #479).
 */

import { generateMetadata } from "../app/u/[username]/page";
import UserOpenGraphImage, {
  alt,
  size,
  contentType,
  runtime,
  escapeText,
} from "../app/u/[username]/opengraph-image";

// Mock fetch globally for testing cached user skills API responses
const originalFetch = global.fetch;

describe("User Profile Open Graph & Twitter Image (Issue #479)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe("Spec & Configuration", () => {
    it("defines 1200x630 dimensions", () => {
      expect(size.width).toBe(1200);
      expect(size.height).toBe(630);
    });

    it("specifies PNG content type", () => {
      expect(contentType).toBe("image/png");
    });

    it("specifies edge runtime", () => {
      expect(runtime).toBe("edge");
    });

    it("has descriptive default alt text", () => {
      expect(alt).toBeDefined();
      expect(alt).toContain("OpenSourceMate");
    });
  });

  describe("escapeText Helper", () => {
    it("escapes html characters properly", () => {
      expect(escapeText("<script>alert('xss')</script>")).toBe(
        "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;"
      );
      expect(escapeText('user & "friend"')).toBe("user &amp; &quot;friend&quot;");
    });

    it("handles empty and nullish text gracefully", () => {
      expect(escapeText("")).toBe("");
      // @ts-expect-error testing invalid input
      expect(escapeText(null)).toBe("");
    });
  });

  describe("generateMetadata", () => {
    it("generates user-specific social preview tags for valid username", async () => {
      const meta = await generateMetadata({
        params: Promise.resolve({ username: "octocat" }),
      });

      expect(meta.title).toBe("octocat on OpenSourceMate");
      expect(meta.description).toContain("@octocat");

      // OpenGraph images
      expect(meta.openGraph).toBeDefined();
      const ogImages = meta.openGraph?.images as Array<{ url: string; width: number; height: number }>;
      expect(Array.isArray(ogImages)).toBe(true);
      expect(ogImages[0].url).toBe("/u/octocat/opengraph-image");
      expect(ogImages[0].width).toBe(1200);
      expect(ogImages[0].height).toBe(630);

      // Twitter card & images
      expect(meta.twitter).toBeDefined();
      expect(meta.twitter?.card).toBe("summary_large_image");
      const twitterImages = meta.twitter?.images as Array<{ url: string; width: number; height: number }>;
      expect(Array.isArray(twitterImages)).toBe(true);
      expect(twitterImages[0].url).toBe("/u/octocat/twitter-image");
      expect(twitterImages[0].width).toBe(1200);
      expect(twitterImages[0].height).toBe(630);
    });

    it("falls back to default social preview for invalid or special-character usernames", async () => {
      const meta = await generateMetadata({
        params: Promise.resolve({ username: "invalid--user!@#" }),
      });

      expect(meta.title).toBe("User not found – OpenSourceMate");
      const ogImages = meta.openGraph?.images as Array<{ url: string }>;
      expect(ogImages[0].url).toBe("/opengraph-image");

      const twImages = meta.twitter?.images as Array<{ url: string }>;
      expect(twImages[0].url).toBe("/twitter-image");
    });
  });

  describe("UserOpenGraphImage Route Handler", () => {
    it("renders personalized card for valid user with top 3 skills", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          login: "octocat",
          skills: ["TypeScript", "React", "Python", "Rust", "Go"],
        }),
      });

      const response = await UserOpenGraphImage({
        params: Promise.resolve({ username: "octocat" }),
      });

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toContain("max-age=3600");
    });

    it("renders fallback banner when user is unknown (404)", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ detail: "User not found" }),
      });

      const response = await UserOpenGraphImage({
        params: Promise.resolve({ username: "nonexistent-user-404" }),
      });

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toContain("max-age=3600");
    });

    it("renders fallback banner when rate-limited (429)", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ detail: "Rate limit exceeded" }),
      });

      const response = await UserOpenGraphImage({
        params: Promise.resolve({ username: "busydev" }),
      });

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it("handles invalid or special-character usernames safely", async () => {
      const response = await UserOpenGraphImage({
        params: Promise.resolve({ username: "bad%20user<>*&^" }),
      });

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });
  });
});
