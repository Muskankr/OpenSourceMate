/**
 * Repository Label Synchronization Script
 *
 * Synchronizes GitHub repository labels from .github/labels.yml.
 *
 * Key guarantees (Issue #353):
 * 1. Creates missing labels with configured colors and descriptions.
 * 2. Updates changed colors and descriptions for existing managed labels.
 * 3. STRICTLY PRESERVES all existing labels in the repository (never deletes used or existing labels,
 *    including NSoC, NSoC-L1/L2/L3, good first issue, etc.).
 * 4. Supports dryRun mode for safe previews on forks and in pull request checks.
 */

const fs = require("fs");
const path = require("path");

/**
 * Parses simple YAML list of label objects without external dependencies.
 * Format:
 * - name: "label name"
 *   color: "0e8a16"
 *   description: "description"
 *
 * @param {string} yamlText
 * @returns {Array<{name: string, color: string, description: string}>}
 */
function parseLabelsYaml(yamlText) {
  const lines = yamlText.split(/\r?\n/);
  const labels = [];
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Skip empty lines and full-line comments
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    // Start of a new label item (e.g., "- name: ..." or "-")
    if (trimmed.startsWith("-")) {
      if (current && current.name) {
        labels.push(finalizeLabel(current));
      }
      current = {};

      const afterDash = trimmed.replace(/^-\s*/, "");
      if (afterDash) {
        parseKeyValue(afterDash, current);
      }
      continue;
    }

    if (current) {
      parseKeyValue(trimmed, current);
    }
  }

  if (current && current.name) {
    labels.push(finalizeLabel(current));
  }

  return labels;
}

function parseKeyValue(line, target) {
  const colonIndex = line.indexOf(":");
  if (colonIndex === -1) {
    return;
  }

  const key = line.slice(0, colonIndex).trim().toLowerCase();
  let value = line.slice(colonIndex + 1).trim();

  // Strip trailing comments (e.g. value # comment) if not inside quotes
  if (!value.startsWith('"') && !value.startsWith("'")) {
    const commentIndex = value.indexOf("#");
    if (commentIndex !== -1) {
      value = value.slice(0, commentIndex).trim();
    }
  }

  // Strip enclosing quotes
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  if (key === "name") {
    target.name = value;
  } else if (key === "color" || key === "colour") {
    target.color = normalizeColor(value);
  } else if (key === "description" || key === "desc") {
    target.description = value;
  }
}

function normalizeColor(color) {
  if (!color) return "ededed";
  let clean = color.trim().replace(/^#/, "").toLowerCase();
  // Ensure valid 6-character hex
  if (/^[0-9a-f]{6}$/i.test(clean)) {
    return clean;
  }
  if (/^[0-9a-f]{3}$/i.test(clean)) {
    return clean
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return clean;
}

function finalizeLabel(label) {
  return {
    name: label.name.trim(),
    color: normalizeColor(label.color || "ededed"),
    description: (label.description || "").trim(),
  };
}

/**
 * Synchronizes repository labels against GitHub API.
 *
 * @param {object} options
 * @param {object} options.github - Octokit instance
 * @param {object} options.context - GitHub context (repo, owner)
 * @param {string} [options.labelsFilePath] - Path to labels.yml
 * @param {string} [options.labelsContent] - Direct YAML content string (for tests)
 * @param {boolean} [options.dryRun=false] - Preview only if true
 * @returns {Promise<object>} Sync summary
 */
async function syncLabels({
  github,
  context,
  labelsFilePath,
  labelsContent,
  dryRun = false,
}) {
  const owner = context.repo.owner;
  const repo = context.repo.repo;

  // 1. Load and parse labels configuration
  let content = labelsContent;
  if (!content) {
    const resolvedPath = labelsFilePath || path.join(process.cwd(), ".github", "labels.yml");
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Labels configuration file not found at: ${resolvedPath}`);
    }
    content = fs.readFileSync(resolvedPath, "utf8");
  }

  const desiredLabels = parseLabelsYaml(content);
  console.log(`📋 Found ${desiredLabels.length} desired labels in configuration.`);

  // 2. Fetch all existing repository labels
  console.log(`🔍 Fetching existing labels from ${owner}/${repo}...`);
  const existingLabels = await github.paginate(github.rest.issues.listLabelsForRepo, {
    owner,
    repo,
    per_page: 100,
  });

  const existingMap = new Map();
  for (const label of existingLabels) {
    existingMap.set(label.name.toLowerCase(), label);
  }

  const created = [];
  const updated = [];
  const unchanged = [];
  const seenExistingNames = new Set();

  // 3. Process each desired label
  for (const desired of desiredLabels) {
    const key = desired.name.toLowerCase();
    const existing = existingMap.get(key);

    if (!existing) {
      // Label needs to be created
      console.log(`➕ [CREATE] "${desired.name}" (color: #${desired.color}) - "${desired.description}"`);
      if (!dryRun) {
        await github.rest.issues.createLabel({
          owner,
          repo,
          name: desired.name,
          color: desired.color,
          description: desired.description,
        });
      }
      created.push(desired);
    } else {
      seenExistingNames.add(existing.name.toLowerCase());
      const existingColor = normalizeColor(existing.color);
      const existingDesc = (existing.description || "").trim();

      const colorMatches = existingColor === desired.color;
      const descMatches = existingDesc === desired.description;
      const nameMatchesExact = existing.name === desired.name;

      if (!colorMatches || !descMatches || !nameMatchesExact) {
        console.log(`🔄 [UPDATE] "${existing.name}" -> name: "${desired.name}", color: #${existingColor} -> #${desired.color}`);
        if (!dryRun) {
          await github.rest.issues.updateLabel({
            owner,
            repo,
            name: existing.name,
            new_name: desired.name,
            color: desired.color,
            description: desired.description,
          });
        }
        updated.push({
          from: { name: existing.name, color: existingColor, description: existingDesc },
          to: desired,
        });
      } else {
        unchanged.push(desired.name);
      }
    }
  }

  // 4. Identify preserved labels (strictly NEVER deleted)
  const preservedExisting = [];
  for (const [key, label] of existingMap.entries()) {
    if (!seenExistingNames.has(key)) {
      preservedExisting.push(label.name);
    }
  }

  console.log("\n==========================================");
  console.log("📊 Label Synchronization Summary:");
  console.log(`   • Total Desired:   ${desiredLabels.length}`);
  console.log(`   • Created:         ${created.length} ${dryRun ? "(dry-run)" : ""}`);
  console.log(`   • Updated:         ${updated.length} ${dryRun ? "(dry-run)" : ""}`);
  console.log(`   • Unchanged:       ${unchanged.length}`);
  console.log(`   • Preserved (safe): ${preservedExisting.length} existing labels kept intact`);
  console.log("==========================================\n");

  if (preservedExisting.length > 0) {
    console.log(`🛡️  Existing unmanaged labels preserved: ${preservedExisting.join(", ")}`);
  }

  return {
    created,
    updated,
    unchanged,
    preservedExisting,
    totalManaged: desiredLabels.length,
    totalExisting: existingLabels.length,
  };
}

// Standalone CLI runner for validation and manual inspection
if (require.main === module) {
  const filePath = process.argv[2] || path.join(__dirname, "..", "labels.yml");
  console.log(`Validating labels file: ${filePath}`);

  try {
    if (!fs.existsSync(filePath)) {
      console.error(`Error: File does not exist at ${filePath}`);
      process.exit(1);
    }

    const text = fs.readFileSync(filePath, "utf8");
    const parsed = parseLabelsYaml(text);
    console.log(`✅ Successfully parsed ${parsed.length} labels.\n`);

    const categories = {
      Difficulty: [],
      Program: [],
      Area: [],
      Status: [],
      Type: [],
      Other: [],
    };

    for (const l of parsed) {
      if (["beginner", "intermediate", "hard", "good first issue"].includes(l.name)) {
        categories.Difficulty.push(l);
      } else if (l.name.startsWith("level") || l.name.startsWith("NSoC")) {
        categories.Program.push(l);
      } else if (["frontend", "backend", "docs", "testing", "devops", "ai-ml", "accessibility", "security"].includes(l.name)) {
        categories.Area.push(l);
      } else if (["needs-triage", "in-progress", "on-hold", "stale-assignment", "blocked"].includes(l.name)) {
        categories.Status.push(l);
      } else if (["bug", "enhancement", "feature", "documentation", "duplicate", "help wanted", "invalid", "question", "wontfix"].includes(l.name)) {
        categories.Type.push(l);
      } else {
        categories.Other.push(l);
      }
    }

    for (const [cat, list] of Object.entries(categories)) {
      if (list.length > 0) {
        console.log(`[${cat} (${list.length})]:`);
        for (const item of list) {
          console.log(`  • "${item.name}" (#${item.color}) - ${item.description}`);
        }
      }
    }
  } catch (err) {
    console.error("❌ Validation failed:", err.message);
    process.exit(1);
  }
}

module.exports = {
  parseLabelsYaml,
  normalizeColor,
  syncLabels,
};
