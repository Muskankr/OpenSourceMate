import {
  getCustomSkillsStorageKey,
  loadCustomSkills,
  saveCustomSkills,
  clearCustomSkills,
  CUSTOM_SKILLS_STORAGE_PREFIX,
} from "../utils/customSkillsStorage";

describe("customSkillsStorage utility", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("constructs correct normalized storage key", () => {
    expect(getCustomSkillsStorageKey("Octocat")).toBe(`${CUSTOM_SKILLS_STORAGE_PREFIX}octocat`);
    expect(getCustomSkillsStorageKey("  torvalds  ")).toBe(
      `${CUSTOM_SKILLS_STORAGE_PREFIX}torvalds`
    );
  });

  it("returns null when no custom skills are stored", () => {
    expect(loadCustomSkills("octocat")).toBeNull();
    expect(loadCustomSkills("")).toBeNull();
  });

  it("saves and loads custom skills from localStorage", () => {
    const skills = ["Python", "Rust", "Docker"];
    saveCustomSkills("octocat", skills);

    const loaded = loadCustomSkills("octocat");
    expect(loaded).toEqual(["Python", "Rust", "Docker"]);
  });

  it("deduplicates skills and trims whitespace on save", () => {
    saveCustomSkills("octocat", ["Python", " Rust ", "Python", "Go"]);
    const loaded = loadCustomSkills("octocat");
    expect(loaded).toEqual(["Python", "Rust", "Go"]);
  });

  it("clears stored custom skills from localStorage", () => {
    saveCustomSkills("octocat", ["Go", "React"]);
    expect(loadCustomSkills("octocat")).toEqual(["Go", "React"]);

    clearCustomSkills("octocat");
    expect(loadCustomSkills("octocat")).toBeNull();
  });

  it("handles corrupted JSON gracefully", () => {
    window.localStorage.setItem(getCustomSkillsStorageKey("octocat"), "invalid-json{");
    expect(loadCustomSkills("octocat")).toBeNull();
  });
});
