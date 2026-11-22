const { test, describe } = require("node:test");
const assert = require("node:assert");
const {
  parseLabelsYaml,
  normalizeColor,
  syncLabels,
} = require("./sync-labels.js");

describe("Label Synchronization Logic", () => {
  const sampleYaml = `
# Difficulty labels
- name: "beginner"
  color: "#0e8a16"
  description: "Small, clear tasks. Great for first-time contributors."

- name: intermediate
  color: fbca04
  description: Needs some understanding of the codebase.

# Mentorship labels
- name: "NSoC"
  color: "1d76db"
  description: "NJACK Season of Code"
`;

  test("parseLabelsYaml correctly parses yaml and normalizes values", () => {
    const labels = parseLabelsYaml(sampleYaml);
    assert.strictEqual(labels.length, 3);

    assert.deepStrictEqual(labels[0], {
      name: "beginner",
      color: "0e8a16", // '#' stripped and lowercased
      description: "Small, clear tasks. Great for first-time contributors.",
    });

    assert.deepStrictEqual(labels[1], {
      name: "intermediate",
      color: "fbca04",
      description: "Needs some understanding of the codebase.",
    });

    assert.deepStrictEqual(labels[2], {
      name: "NSoC",
      color: "1d76db",
      description: "NJACK Season of Code",
    });
  });

  test("normalizeColor correctly handles various hex formats", () => {
    assert.strictEqual(normalizeColor("#0E8A16"), "0e8a16");
    assert.strictEqual(normalizeColor("FBCA04"), "fbca04");
    assert.strictEqual(normalizeColor("#fff"), "ffffff");
    assert.strictEqual(normalizeColor(""), "ededed");
    assert.strictEqual(normalizeColor(null), "ededed");
  });

  test("syncLabels creates missing labels", async () => {
    const createdCalls = [];
    const updatedCalls = [];

    const mockGithub = {
      paginate: async () => [
        { name: "good first issue", color: "7057ff", description: "Specially chosen for newcomers." },
      ],
      rest: {
        issues: {
          createLabel: async (params) => {
            createdCalls.push(params);
            return { data: params };
          },
          updateLabel: async (params) => {
            updatedCalls.push(params);
            return { data: params };
          },
        },
      },
    };

    const mockContext = {
      repo: { owner: "Muskankr", repo: "OpenSourceMate" },
    };

    const yaml = `
- name: "beginner"
  color: "0e8a16"
  description: "Starter task"
- name: "good first issue"
  color: "7057ff"
  description: "Specially chosen for newcomers."
`;

    const summary = await syncLabels({
      github: mockGithub,
      context: mockContext,
      labelsContent: yaml,
      dryRun: false,
    });

    assert.strictEqual(summary.created.length, 1);
    assert.strictEqual(summary.created[0].name, "beginner");
    assert.strictEqual(createdCalls.length, 1);
    assert.strictEqual(createdCalls[0].name, "beginner");
    assert.strictEqual(createdCalls[0].color, "0e8a16");

    assert.strictEqual(summary.unchanged.length, 1);
    assert.strictEqual(summary.unchanged[0], "good first issue");
    assert.strictEqual(updatedCalls.length, 0);
  });

  test("syncLabels updates labels when color or description differs", async () => {
    const updatedCalls = [];

    const mockGithub = {
      paginate: async () => [
        { name: "frontend", color: "oldcol", description: "Old description" },
      ],
      rest: {
        issues: {
          createLabel: async () => {},
          updateLabel: async (params) => {
            updatedCalls.push(params);
            return { data: params };
          },
        },
      },
    };

    const mockContext = {
      repo: { owner: "Muskankr", repo: "OpenSourceMate" },
    };

    const yaml = `
- name: "frontend"
  color: "1d76db"
  description: "UI, styling and client-side code"
`;

    const summary = await syncLabels({
      github: mockGithub,
      context: mockContext,
      labelsContent: yaml,
      dryRun: false,
    });

    assert.strictEqual(summary.created.length, 0);
    assert.strictEqual(summary.updated.length, 1);
    assert.strictEqual(updatedCalls.length, 1);
    assert.strictEqual(updatedCalls[0].name, "frontend");
    assert.strictEqual(updatedCalls[0].color, "1d76db");
    assert.strictEqual(updatedCalls[0].description, "UI, styling and client-side code");
  });

  test("syncLabels preserves existing labels and NEVER deletes used/unmanaged labels", async () => {
    const createdCalls = [];
    const updatedCalls = [];
    const deleteCalls = [];

    const mockGithub = {
      paginate: async () => [
        { name: "NSoC", color: "1d76db", description: "Season of code" },
        { name: "NSoC-L1", color: "0e8a16", description: "Level 1" },
        { name: "used-custom-label", color: "112233", description: "Used on 15 issues" },
      ],
      rest: {
        issues: {
          createLabel: async (params) => createdCalls.push(params),
          updateLabel: async (params) => updatedCalls.push(params),
          deleteLabel: async (params) => deleteCalls.push(params),
        },
      },
    };

    const mockContext = {
      repo: { owner: "Muskankr", repo: "OpenSourceMate" },
    };

    // Target YAML does not mention 'used-custom-label'
    const yaml = `
- name: "NSoC"
  color: "1d76db"
  description: "Season of code"
- name: "NSoC-L1"
  color: "0e8a16"
  description: "Level 1"
`;

    const summary = await syncLabels({
      github: mockGithub,
      context: mockContext,
      labelsContent: yaml,
      dryRun: false,
    });

    // deleteLabel should NEVER even be called
    assert.strictEqual(deleteCalls.length, 0);
    assert.strictEqual(summary.preservedExisting.length, 1);
    assert.strictEqual(summary.preservedExisting[0], "used-custom-label");
  });

  test("syncLabels respects dryRun mode without modifying repository", async () => {
    const createdCalls = [];
    const updatedCalls = [];

    const mockGithub = {
      paginate: async () => [
        { name: "backend", color: "oldcol", description: "Old" },
      ],
      rest: {
        issues: {
          createLabel: async (params) => createdCalls.push(params),
          updateLabel: async (params) => updatedCalls.push(params),
        },
      },
    };

    const mockContext = {
      repo: { owner: "Muskankr", repo: "OpenSourceMate" },
    };

    const yaml = `
- name: "backend"
  color: "5319e7"
  description: "Server logic"
- name: "new-label"
  color: "123456"
  description: "Brand new label"
`;

    const summary = await syncLabels({
      github: mockGithub,
      context: mockContext,
      labelsContent: yaml,
      dryRun: true,
    });

    assert.strictEqual(summary.created.length, 1);
    assert.strictEqual(summary.updated.length, 1);
    // Because dryRun is true, no actual mutations took place
    assert.strictEqual(createdCalls.length, 0);
    assert.strictEqual(updatedCalls.length, 0);
  });
});
