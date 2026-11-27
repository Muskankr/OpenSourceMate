import sitemap from "../app/sitemap";
import robots from "../app/robots";
import { PUBLIC_STATIC_ROUTES } from "../utils/seo";
import { metadata as privacyMetadata } from "../app/privacy/page";
import { metadata as compareMetadata } from "../app/compare/layout";
import { metadata as contributeMetadata } from "../app/contribute/layout";
import { generateMetadata as generateUserMetadata } from "../app/u/[username]/page";

describe("Sitemap, Robots.txt, and Canonical URLs (Issue #473)", () => {
  it("generates sitemap.xml containing all public static routes", () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);

    expect(entries).toHaveLength(PUBLIC_STATIC_ROUTES.length);
    expect(urls.some((u) => u.endsWith("/compare"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/contribute"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/privacy"))).toBe(true);
    // Root URL
    expect(urls.some((u) => !u.endsWith("/compare") && !u.endsWith("/contribute") && !u.endsWith("/privacy"))).toBe(true);

    // Dynamic user pages and API routes must not be in sitemap
    expect(urls.some((u) => u.includes("/u/"))).toBe(false);
    expect(urls.some((u) => u.includes("/api/"))).toBe(false);
  });

  it("generates robots.txt referencing sitemap.xml and disallowing /api/ and /u/", () => {
    const config = robots();
    expect(config.sitemap).toMatch(/\/sitemap\.xml$/);

    const rules = Array.isArray(config.rules) ? config.rules[0] : config.rules;
    expect(rules.allow).toBe("/");
    expect(rules.disallow).toEqual(expect.arrayContaining(["/api/", "/u/"]));
  });

  it("sets canonical URLs on public static pages", () => {
    expect(privacyMetadata.alternates?.canonical).toBe("/privacy");
    expect(compareMetadata.alternates?.canonical).toBe("/compare");
    expect(contributeMetadata.alternates?.canonical).toBe("/contribute");
  });

  it("marks /u/[username] result pages as noindex, nofollow with canonical URL", async () => {
    const validMeta = await generateUserMetadata({
      params: Promise.resolve({ username: "octocat" }),
    });
    expect(validMeta.robots).toEqual({ index: false, follow: false });
    expect(validMeta.alternates?.canonical).toBe("/u/octocat");

    const invalidMeta = await generateUserMetadata({
      params: Promise.resolve({ username: "bad user!" }),
    });
    expect(invalidMeta.robots).toEqual({ index: false, follow: false });
  });
});
