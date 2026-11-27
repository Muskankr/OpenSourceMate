import { fetchMatchedIssues } from "../utils/apiClient";

describe("fetchMatchedIssues pagination parameters (Issue #481)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("passes limit and cursor query parameters to endpoint", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        username: "octocat",
        recommendations: [],
        total: 100,
        next_cursor: 20,
        limit: 20,
      }),
    });
    global.fetch = mockFetch;

    const response = await fetchMatchedIssues("octocat", {
      limit: 20,
      cursor: 0,
      skills: ["python"],
      program: "nsoc",
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const requestedUrl = mockFetch.mock.calls[0][0];
    expect(requestedUrl).toContain("/api/matching/users/octocat/issues?");
    expect(requestedUrl).toContain("limit=20");
    expect(requestedUrl).toContain("cursor=0");
    expect(requestedUrl).toContain("skills=python");
    expect(requestedUrl).toContain("program=nsoc");

    expect(response.total).toBe(100);
    expect(response.next_cursor).toBe(20);
  });

  it("omits limit and cursor when not provided, allowing backend defaults", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        username: "octocat",
        recommendations: [],
        total: 0,
      }),
    });
    global.fetch = mockFetch;

    await fetchMatchedIssues("octocat");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const requestedUrl = mockFetch.mock.calls[0][0];
    expect(requestedUrl).toContain("/api/matching/users/octocat/issues");
    expect(requestedUrl).not.toContain("limit=");
    expect(requestedUrl).not.toContain("cursor=");
  });
});
