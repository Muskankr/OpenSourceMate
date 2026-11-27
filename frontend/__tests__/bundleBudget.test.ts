import fs from "fs";
import path from "path";
import { analyzeBundles } from "../scripts/check-bundle-budget.mjs";

describe("Bundle Size Budget Checker (Issue #454)", () => {
  const budgetConfigFile = path.resolve(__dirname, "../bundle-budget.json");

  it("ensures bundle-budget.json exists and has valid budget definitions", () => {
    expect(fs.existsSync(budgetConfigFile)).toBe(true);

    const config = JSON.parse(fs.readFileSync(budgetConfigFile, "utf8"));
    expect(Array.isArray(config.budgets)).toBe(true);
    expect(config.budgets.length).toBeGreaterThan(0);

    for (const b of config.budgets) {
      expect(typeof b.path).toBe("string");
      expect(typeof b.name).toBe("string");
      expect(typeof b.maxSizeKB).toBe("number");
      expect(b.maxSizeKB).toBeGreaterThan(0);
    }
  });

  it("contains budget entries for key routes", () => {
    const config = JSON.parse(fs.readFileSync(budgetConfigFile, "utf8"));
    const paths = config.budgets.map((b: { path: string }) => b.path);

    expect(paths).toContain("/");
    expect(paths).toContain("shared");
  });

  it("analyzeBundles returns valid status objects for all budgets", () => {
    const analysis = analyzeBundles();

    expect(Array.isArray(analysis.results)).toBe(true);
    expect(typeof analysis.hasFailures).toBe("boolean");
    expect(typeof analysis.allChunksGzipKB).toBe("number");

    for (const r of analysis.results) {
      expect(r).toHaveProperty("path");
      expect(r).toHaveProperty("name");
      expect(r).toHaveProperty("maxSizeKB");
      expect(r).toHaveProperty("measuredGzipKB");
      expect(r).toHaveProperty("passed");
      expect(typeof r.passed).toBe("boolean");
    }
  });
});
