import { FALLBACK_GOOD_FIRST_ISSUES } from "../app/contribute/page";

describe("Contribute Page Fallbacks and Filters", () => {
  it("provides valid fallback issues with required attributes", () => {
    expect(FALLBACK_GOOD_FIRST_ISSUES.length).toBeGreaterThanOrEqual(5);
    for (const issue of FALLBACK_GOOD_FIRST_ISSUES) {
      expect(issue.title).toBeTruthy();
      expect(issue.url).toContain("github.com/Muskankr/OpenSourceMate");
      expect(issue.labels).toContain("good first issue");
      expect(issue.match_score).toBeGreaterThan(0);
      expect(issue.match_reasons?.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("filters fallback issues correctly by domain tags", () => {
    const backendIssues = FALLBACK_GOOD_FIRST_ISSUES.filter((i) =>
      i.labels?.includes("backend")
    );
    expect(backendIssues.length).toBeGreaterThanOrEqual(2);

    const frontendIssues = FALLBACK_GOOD_FIRST_ISSUES.filter((i) =>
      i.labels?.includes("frontend")
    );
    expect(frontendIssues.length).toBeGreaterThanOrEqual(2);

    const docIssues = FALLBACK_GOOD_FIRST_ISSUES.filter((i) =>
      i.labels?.includes("documentation")
    );
    expect(docIssues.length).toBeGreaterThanOrEqual(1);
  });

  it("ensures each issue has a difficulty level suitable for beginners", () => {
    for (const issue of FALLBACK_GOOD_FIRST_ISSUES) {
      expect(issue.difficulty).toBe("Beginner");
    }
  });

  it("verifies unique issue titles among fallbacks", () => {
    const titles = FALLBACK_GOOD_FIRST_ISSUES.map((i) => i.title);
    const uniqueTitles = new Set(titles);
    expect(uniqueTitles.size).toBe(titles.length);
  });
});
