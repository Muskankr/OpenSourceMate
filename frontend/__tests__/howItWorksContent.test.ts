import { HOW_IT_WORKS_CONTENT } from "../data/howItWorksContent";
import contentFromContentDir from "../content/howItWorks";

describe("How It Works & FAQ Single Content File Integrity (#445)", () => {
  it("exports valid metadata and navigation sections", () => {
    expect(HOW_IT_WORKS_CONTENT.metadata.pageTitle).toBe("How It Works & Privacy");
    expect(HOW_IT_WORKS_CONTENT.metadata.leadParagraph).toMatch(/plain-language explanation/i);
    expect(HOW_IT_WORKS_CONTENT.navigationSections.length).toBeGreaterThanOrEqual(5);
    const sectionIds = HOW_IT_WORKS_CONTENT.navigationSections.map((s) => s.id);
    expect(sectionIds).toContain("public-data");
    expect(sectionIds).toContain("skill-detection");
    expect(sectionIds).toContain("issue-matching");
    expect(sectionIds).toContain("storage-privacy");
    expect(sectionIds).toContain("faq");
  });

  it("transparently details public data retrieval vs private boundaries", () => {
    const { publicDataPoints, privateDataPoints, callout } = HOW_IT_WORKS_CONTENT.dataRetrieval;
    expect(callout).toMatch(/no account creation.*zero access to private repositories/i);
    expect(publicDataPoints.length).toBeGreaterThanOrEqual(4);
    expect(privateDataPoints.length).toBeGreaterThanOrEqual(3);

    // Ensure all public points are flagged included=true and private included=false
    publicDataPoints.forEach((p) => expect(p.included).toBe(true));
    privateDataPoints.forEach((p) => expect(p.included).toBe(false));

    const publicTitles = publicDataPoints.map((p) => p.title);
    expect(publicTitles).toContain("Public User Profile");
    expect(publicTitles).toContain("Public Repositories");
    expect(publicTitles).toContain("Language Byte Breakdowns");

    const privateTitles = privateDataPoints.map((p) => p.title);
    expect(privateTitles).toContain("Private Repositories & Commits");
    expect(privateTitles).toContain("OAuth Account Authorizations");
  });

  it("explains skill detection pipeline, fork commit filtering, and proficiency tiers", () => {
    const { steps, forkExplanation, proficiencyTiers } = HOW_IT_WORKS_CONTENT.skillDetection;
    expect(steps.length).toBe(4);
    expect(steps[0].title).toMatch(/Language & Manifest Aggregation/i);
    expect(steps[1].title).toMatch(/Noise Reduction/i);
    expect(steps[2].title).toMatch(/Fork-Aware Commit Detection/i);
    expect(steps[3].title).toMatch(/Proficiency Tier/i);

    expect(forkExplanation.badge).toBe("Fork-Aware");
    expect(forkExplanation.description).toMatch(/pure forks/i);

    const tierNames = proficiencyTiers.map((t) => t.name);
    expect(tierNames).toEqual(["Learning", "Comfortable", "Strong"]);
  });

  it("defines issue matching scoring weights and repository health signal thresholds", () => {
    const { scoringFactors, healthSignals, bonusFeatures } = HOW_IT_WORKS_CONTENT.issueMatching;
    expect(scoringFactors.length).toBeGreaterThanOrEqual(4);
    const factorNames = scoringFactors.map((f) => f.name);
    expect(factorNames).toContain("Skill & Language Overlap");
    expect(factorNames).toContain("Beginner-Friendly Labels");
    expect(factorNames).toContain("Repository Health & Maintainer Signals");

    const badges = healthSignals.map((h) => h.badge);
    expect(badges).toContain("Active");
    expect(badges).toContain("Slow");
    expect(badges).toContain("Inactive");
    expect(badges).toContain("Unknown");

    const featureTitles = bonusFeatures.map((b) => b.title);
    expect(featureTitles).toContain("Contributor Programs");
    expect(featureTitles).toContain("'I want to learn' Mode");
    expect(featureTitles).toContain("Custom Preferences");
  });

  it("contains clear matrix of what is stored vs what is never stored", () => {
    const { table, takeaway } = HOW_IT_WORKS_CONTENT.storageAndPrivacy;
    expect(table.length).toBeGreaterThanOrEqual(8);
    expect(takeaway).toMatch(/full control/i);

    const storedItems = table.filter((t) => t.stored);
    const notStoredItems = table.filter((t) => !t.stored);

    expect(storedItems.length).toBeGreaterThanOrEqual(4);
    expect(notStoredItems.length).toBeGreaterThanOrEqual(4);

    // Stored items must be in browser localStorage or server memory TTLCache
    storedItems.forEach((item) => {
      expect(["Browser (localStorage)", "Server Memory (TTLCache)"]).toContain(item.location);
    });

    // Never stored items must be marked accordingly
    notStoredItems.forEach((item) => {
      expect(item.location).toBe("Never Stored");
    });

    const notStoredNames = notStoredItems.map((n) => n.item);
    expect(notStoredNames).toContain("User Accounts, Passwords & Credentials");
    expect(notStoredNames).toContain("Persistent Database Records");
    expect(notStoredNames).toContain("Private Repositories or Private Code");
  });

  it("contains comprehensive FAQ questions and answers across all categories", () => {
    const { items } = HOW_IT_WORKS_CONTENT.faq;
    expect(items.length).toBeGreaterThanOrEqual(10);

    const categories = new Set(items.map((i) => i.category));
    expect(categories.has("Data & Privacy")).toBe(true);
    expect(categories.has("Skill Detection")).toBe(true);
    expect(categories.has("Issue Matching")).toBe(true);
    expect(categories.has("General")).toBe(true);

    items.forEach((item) => {
      expect(item.id).toBeTruthy();
      expect(item.question.endsWith("?")).toBe(true);
      expect(item.answer.length).toBeGreaterThan(20);
    });
  });

  it("re-exports correctly from frontend/content/howItWorks", () => {
    expect(contentFromContentDir).toEqual(HOW_IT_WORKS_CONTENT);
  });
});
