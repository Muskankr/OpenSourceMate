/**
 * Unit & component tests for the Contributors Wall (Issue #201).
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ContributorsWall from "../components/ContributorsWall";
import {
  ContributorsFetchError,
  fetchContributors,
  normalizeContributors,
} from "../utils/githubContributors";

const AVATAR = "https://avatars.githubusercontent.com/u/1?v=4";

function raw(login: string, contributions: number, extra: Record<string, unknown> = {}) {
  return {
    login,
    avatar_url: AVATAR,
    html_url: `https://github.com/${login}`,
    contributions,
    type: "User",
    ...extra,
  };
}

function mockResponse(status: number, body?: unknown, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
    json: async () => {
      if (body === undefined) throw new SyntaxError("Unexpected end of JSON input");
      return body;
    },
  };
}

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe("normalizeContributors", () => {
  it("filters bot accounts, anonymous entries and duplicates", () => {
    const result = normalizeContributors([
      raw("alice", 12),
      raw("dependabot[bot]", 30, { type: "Bot" }),
      raw("some-app[bot]", 4),
      { type: "Anonymous", contributions: 3 },
      raw("Alice", 2),
      raw("bob", 8),
    ]);
    expect(result.map((c) => c.login)).toEqual(["alice", "bob"]);
  });

  it("respects the limit and keeps API order", () => {
    const list = [raw("a", 9), raw("b", 8), raw("c", 7)];
    expect(normalizeContributors(list, 2).map((c) => c.login)).toEqual(["a", "b"]);
  });

  it("falls back for untrusted avatar and profile URLs", () => {
    const [c] = normalizeContributors([
      raw("eve", 1, {
        avatar_url: "https://evil.example/a.png",
        html_url: "https://evil.example/eve",
      }),
    ]);
    expect(c?.avatarUrl).toBe("");
    expect(c?.profileUrl).toBe("https://github.com/eve");
  });

  it("returns an empty list for non-array payloads", () => {
    expect(normalizeContributors({ message: "nope" })).toEqual([]);
    expect(normalizeContributors(null)).toEqual([]);
  });
});

describe("fetchContributors", () => {
  it("returns normalised contributors on success", async () => {
    fetchMock.mockResolvedValue(mockResponse(200, [raw("alice", 5)]));
    const result = await fetchContributors();
    expect(result).toHaveLength(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/repos/Muskankr/OpenSourceMate/contributors");
  });

  it("returns an empty list for 204 No Content", async () => {
    fetchMock.mockResolvedValue(mockResponse(204));
    await expect(fetchContributors()).resolves.toEqual([]);
  });

  it("throws a rate_limit error with reset time on 403 + exhausted quota", async () => {
    fetchMock.mockResolvedValue(
      mockResponse(403, {}, { "x-ratelimit-remaining": "0", "x-ratelimit-reset": "1800000000" })
    );
    await expect(fetchContributors()).rejects.toMatchObject({
      kind: "rate_limit",
      resetAt: new Date(1800000000 * 1000).toISOString(),
    });
  });

  it("throws a network error when fetch rejects", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(fetchContributors()).rejects.toBeInstanceOf(ContributorsFetchError);
    await expect(fetchContributors()).rejects.toMatchObject({ kind: "network" });
  });

  it("throws unknown error on server failures", async () => {
    fetchMock.mockResolvedValue(mockResponse(500, {}));
    await expect(fetchContributors()).rejects.toMatchObject({ kind: "unknown", status: 500 });
  });
});

describe("ContributorsWall component", () => {
  it("shows skeletons while loading", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    render(<ContributorsWall />);
    expect(screen.getAllByTestId("contributor-skeleton").length).toBeGreaterThan(0);
  });

  it("renders contributor cards linking to GitHub profiles with accessible avatars", async () => {
    fetchMock.mockResolvedValue(
      mockResponse(200, [raw("alice", 12), raw("bob", 1), raw("ci[bot]", 99, { type: "Bot" })])
    );
    render(<ContributorsWall />);

    expect(await screen.findByText("alice")).toBeInTheDocument();
    expect(screen.getByText("alice")).toHaveAttribute("title", "alice");
    expect(screen.getByText("12 contributions")).toBeInTheDocument();
    expect(screen.getByText("1 contribution")).toBeInTheDocument();
    expect(screen.queryByText("ci[bot]")).not.toBeInTheDocument();
    expect(screen.getByAltText("alice's GitHub avatar")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /alice, 12 contributions/i });
    expect(link).toHaveAttribute("href", "https://github.com/alice");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("keeps an accessible avatar label when the image falls back to an initial", async () => {
    fetchMock.mockResolvedValue(mockResponse(200, [raw("alice", 12)]));
    render(<ContributorsWall />);

    const avatar = await screen.findByAltText("alice's GitHub avatar");
    fireEvent.error(avatar);

    expect(screen.getByRole("img", { name: "alice's GitHub avatar" })).toHaveTextContent("A");
  });

  it("preserves the full username in the tooltip and accessible link name", async () => {
    const login = "harshvardhan-long-username";
    fetchMock.mockResolvedValue(mockResponse(200, [raw(login, 12)]));
    render(<ContributorsWall />);

    expect(await screen.findByText(login)).toHaveAttribute("title", login);
    expect(
      screen.getByRole("link", { name: `${login}, 12 contributions. Opens GitHub profile in a new tab` })
    ).toBeInTheDocument();
  });

  it("renders an empty state when there are no contributors", async () => {
    fetchMock.mockResolvedValue(mockResponse(200, []));
    render(<ContributorsWall />);
    expect(await screen.findByText(/no contributors to show yet/i)).toBeInTheDocument();
  });

  it("explains rate limiting without breaking the page", async () => {
    fetchMock.mockResolvedValue(mockResponse(429, {}));
    render(<ContributorsWall />);
    expect(await screen.findByText(/limiting requests/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /built by our contributors/i })).toBeInTheDocument();
  });

  it("shows a network error and recovers on retry", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    fetchMock.mockResolvedValueOnce(mockResponse(200, [raw("alice", 3)]));
    render(<ContributorsWall />);

    expect(await screen.findByText(/couldn't reach github/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    await waitFor(() => expect(screen.getByText("alice")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
