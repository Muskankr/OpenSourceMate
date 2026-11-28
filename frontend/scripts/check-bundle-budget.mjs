#!/usr/bin/env node
/**
 * Bundle Size Analyzer and Budget Checker for OpenSourceMate (Issue #454).
 *
 * Inspects `.next/build-manifest.json` and `.next/app-build-manifest.json` after `next build`.
 * Measures total uncompressed and gzipped JS loaded for each entry route and shared framework chunks.
 * Compares sizes against thresholds configured in `bundle-budget.json`.
 *
 * Exits with status 1 if any bundle exceeds its budget.
 * Writes a Markdown table summary to GITHUB_STEP_SUMMARY when executed in GitHub Actions.
 */

import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";

const currentDir =
  typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, "..");
const nextDir = path.join(rootDir, ".next");
const budgetConfigFile = path.join(rootDir, "bundle-budget.json");

function getFileSize(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const uncompressedBytes = buffer.length;
    const gzippedBytes = zlib.gzipSync(buffer).length;
    return {
      uncompressedKB: +(uncompressedBytes / 1024).toFixed(2),
      gzippedKB: +(gzippedBytes / 1024).toFixed(2),
    };
  } catch {
    return { uncompressedKB: 0, gzippedKB: 0 };
  }
}

function loadBudgets() {
  if (!fs.existsSync(budgetConfigFile)) {
    console.error(`Error: Budget config file not found at ${budgetConfigFile}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(budgetConfigFile, "utf8");
  return JSON.parse(raw);
}

export function analyzeBundles() {
  const budgetConfig = loadBudgets();
  const buildManifestPath = path.join(nextDir, "build-manifest.json");
  const appBuildManifestPath = path.join(nextDir, "app-build-manifest.json");

  // Read available manifests
  let appPages = {};
  let sharedFiles = new Set();

  if (fs.existsSync(appBuildManifestPath)) {
    try {
      const appManifest = JSON.parse(fs.readFileSync(appBuildManifestPath, "utf8"));
      appPages = appManifest.pages || {};
    } catch (err) {
      console.warn("Could not parse app-build-manifest.json:", err.message);
    }
  }

  if (fs.existsSync(buildManifestPath)) {
    try {
      const buildManifest = JSON.parse(fs.readFileSync(buildManifestPath, "utf8"));
      (buildManifest.rootMainFiles || []).forEach((f) => sharedFiles.add(f));
      (buildManifest.pages?.["/_app"] || []).forEach((f) => sharedFiles.add(f));
    } catch (err) {
      console.warn("Could not parse build-manifest.json:", err.message);
    }
  }

  // Calculate static JS directory sizes as fallback/complement
  const staticChunksDir = path.join(nextDir, "static", "chunks");
  let allChunksTotalKB = 0;
  let allChunksGzipKB = 0;

  if (fs.existsSync(staticChunksDir)) {
    const chunkFiles = fs.readdirSync(staticChunksDir, { recursive: true });
    for (const f of chunkFiles) {
      if (typeof f === "string" && f.endsWith(".js")) {
        const fullPath = path.join(staticChunksDir, f);
        if (fs.statSync(fullPath).isFile()) {
          const s = getFileSize(fullPath);
          allChunksTotalKB += s.uncompressedKB;
          allChunksGzipKB += s.gzippedKB;
        }
      }
    }
  }

  const results = [];
  let hasFailures = false;

  for (const item of budgetConfig.budgets) {
    let measuredGzipKB = 0;
    let measuredRawKB = 0;
    const pathKey = item.path;

    if (pathKey === "shared") {
      // Sum shared chunks
      for (const file of sharedFiles) {
        if (file.endsWith(".js")) {
          const fp = path.join(nextDir, file);
          const s = getFileSize(fp);
          measuredGzipKB += s.gzippedKB;
          measuredRawKB += s.uncompressedKB;
        }
      }
    } else {
      // Look up in appPages
      const pageFiles = appPages[pathKey] || appPages[`${pathKey}/page`] || [];
      const routeFiles = new Set([...pageFiles, ...sharedFiles]);
      for (const file of routeFiles) {
        if (file.endsWith(".js")) {
          const fp = path.join(nextDir, file);
          const s = getFileSize(fp);
          measuredGzipKB += s.gzippedKB;
          measuredRawKB += s.uncompressedKB;
        }
      }
    }

    // Round
    measuredGzipKB = +measuredGzipKB.toFixed(2);
    measuredRawKB = +measuredRawKB.toFixed(2);

    const isOver = measuredGzipKB > item.maxSizeKB;
    if (isOver) {
      hasFailures = true;
    }

    results.push({
      path: item.path,
      name: item.name,
      maxSizeKB: item.maxSizeKB,
      measuredGzipKB,
      measuredRawKB,
      passed: !isOver,
    });
  }

  return {
    results,
    hasFailures,
    allChunksTotalKB: +allChunksTotalKB.toFixed(2),
    allChunksGzipKB: +allChunksGzipKB.toFixed(2),
  };
}

function run() {
  console.log("Analyzing Next.js bundle sizes against budgets...\n");
  const { results, hasFailures, allChunksGzipKB } = analyzeBundles();

  console.log("----------------------------------------------------------------------------------");
  console.log(" Route / Chunk               | Size (Gzip)  | Budget (Gzip)| Status               ");
  console.log("----------------------------------------------------------------------------------");

  const summaryRows = [];
  summaryRows.push("| Route / Target | Measured (Gzip) | Budget (Gzip) | Status |");
  summaryRows.push("| :--- | :--- | :--- | :--- |");

  for (const r of results) {
    const statusStr = r.passed ? "✅ PASS" : "❌ OVER BUDGET";
    console.log(
      ` ${r.name.padEnd(26)} | ${(r.measuredGzipKB + " KB").padStart(12)} | ${(r.maxSizeKB + " KB").padStart(12)} | ${statusStr}`
    );
    summaryRows.push(
      `| **${r.name}** (\`${r.path}\`) | ${r.measuredGzipKB} KB | ${r.maxSizeKB} KB | ${statusStr} |`
    );
  }

  console.log("----------------------------------------------------------------------------------");
  console.log(` Total static JavaScript chunks (all pages): ${allChunksGzipKB} KB (gzip)\n`);

  // Write to GitHub Actions Step Summary if available
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    const md = [
      "### 📦 JavaScript Bundle Size & Budget Report",
      "",
      ...summaryRows,
      "",
      `*Total static JS chunks across application: **${allChunksGzipKB} KB** (gzipped)*`,
      "",
      hasFailures
        ? "> ⚠️ **One or more bundles exceeded their performance budget!** Review bundle dependencies or adjust `frontend/bundle-budget.json`."
        : "> ✨ **All bundles are within performance budgets.**",
      "",
    ].join("\n");

    try {
      fs.appendFileSync(summaryFile, md);
    } catch (err) {
      console.warn("Could not write to GITHUB_STEP_SUMMARY:", err.message);
    }
  }

  if (hasFailures) {
    console.error(
      "❌ Bundle budget check failed. One or more bundles exceed the maximum allowed size."
    );
    process.exit(1);
  } else {
    console.log("✅ All bundles are within configured budgets.");
    process.exit(0);
  }
}

if (process.argv[1] && process.argv[1].endsWith("check-bundle-budget.mjs")) {
  run();
}
