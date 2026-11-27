import fs from "fs";
import path from "path";

describe("Service Worker & Cache Invalidation (public/sw.js)", () => {
  const swPath = path.resolve(__dirname, "../public/sw.js");
  let swSource = "";

  beforeAll(() => {
    swSource = fs.readFileSync(swPath, "utf-8");
  });

  it("exists in the public folder", () => {
    expect(fs.existsSync(swPath)).toBe(true);
  });

  it("defines cache names with versioning", () => {
    expect(swSource).toMatch(/const SW_VERSION\s*=\s*["'][^"']+["']/);
    expect(swSource).toContain("osm-shell-");
    expect(swSource).toContain("osm-data-");
    expect(swSource).toContain("CURRENT_CACHES");
  });

  it("precaches core application shell assets during install", () => {
    expect(swSource).toContain('addEventListener("install"');
    expect(swSource).toContain("PRECACHE_ASSETS");
    expect(swSource).toContain('"/"');
    expect(swSource).toContain('"/manifest.webmanifest"');
    expect(swSource).toContain('"/icon-192.png"');
    expect(swSource).toContain('"/icon-512.png"');
  });

  it("removes outdated caches on activate event to replace old caches upon deployment", () => {
    expect(swSource).toContain('addEventListener("activate"');
    expect(swSource).toMatch(/caches\s*\.\s*keys\(\)/);
    expect(swSource).toContain("caches.delete(cacheName)");
    expect(swSource).toContain("CURRENT_CACHES.includes(cacheName)");
  });

  it("immediately takes control using skipWaiting and clients.claim", () => {
    expect(swSource).toContain("self.skipWaiting()");
    expect(swSource).toContain("self.clients.claim()");
  });

  it("implements network-first with shell fallback for navigation requests", () => {
    expect(swSource).toContain('request.mode === "navigate"');
    expect(swSource).toContain('caches.match("/")');
  });

  it("caches GitHub user analysis and recommendations responses", () => {
    expect(swSource).toContain("/api/github/users/");
    expect(swSource).toContain("/api/matching/");
    expect(swSource).toContain("DATA_CACHE_NAME");
  });

  it("handles SKIP_WAITING client message", () => {
    expect(swSource).toContain("SKIP_WAITING");
    expect(swSource).toContain('addEventListener("message"');
  });
});
