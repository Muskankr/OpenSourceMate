import {
  analyzerReducer,
  initialAnalyzerState,
  type AnalyzerData,
  type AnalyzerState,
} from "../utils/analyzerState";

const data: AnalyzerData = {
  profile: {
    username: "octocat",
    name: "The Octocat",
    bio: "A developer",
    avatar_url: "https://example.com/avatar.png",
    public_repositories: 1,
    followers: 1,
    following: 1,
    profile_url: "https://github.com/octocat",
  },
  skills: {
    username: "octocat",
    skills: [],
    total_repositories_analyzed: 1,
  },
};

describe("analyzerReducer", () => {
  it("transitions from idle to loading and success", () => {
    const loading = analyzerReducer(initialAnalyzerState, {
      type: "submit",
      requestId: 1,
      username: "octocat",
    });

    expect(loading).toEqual({
      status: "loading",
      requestId: 1,
      username: "octocat",
    });
    expect(
      analyzerReducer(loading, { type: "success", requestId: 1, data })
    ).toEqual({
      status: "success",
      requestId: 1,
      username: "octocat",
      data,
    });
  });

  it("transitions to error and rate-limited states with their metadata", () => {
    const loading = analyzerReducer(initialAnalyzerState, {
      type: "submit",
      requestId: 2,
      username: "octocat",
    });
    const errored = analyzerReducer(loading, {
      type: "error",
      requestId: 2,
      message: "Unable to connect",
      canRetry: true,
    });

    expect(errored).toMatchObject({ status: "error", message: "Unable to connect" });

    const rateLimited = analyzerReducer(errored, {
      type: "rate-limited",
      requestId: 2,
      message: "Rate limit reached",
      resetAt: "2030-01-01T00:00:00.000Z",
      canRetry: true,
    });

    expect(rateLimited).toEqual({
      status: "rate-limited",
      requestId: 2,
      username: "octocat",
      message: "Rate limit reached",
      resetAt: "2030-01-01T00:00:00.000Z",
      canRetry: true,
    });
  });

  it("preserves previous results while retrying and after failure", () => {
    const success: AnalyzerState = {
      status: "success",
      requestId: 3,
      username: "octocat",
      data,
    };
    const loading = analyzerReducer(success, {
      type: "submit",
      requestId: 4,
      username: "octocat",
      data,
    });

    expect(loading).toMatchObject({ status: "loading", data });
    expect(
      analyzerReducer(loading, {
        type: "error",
        requestId: 4,
        message: "Try again",
        canRetry: true,
      })
    ).toMatchObject({ status: "error", data });

    const refreshed = analyzerReducer(
      analyzerReducer(success, {
        type: "submit",
        requestId: 5,
        username: "octocat",
        data,
      }),
      { type: "success", requestId: 5, data }
    );

    expect(refreshed).toMatchObject({ status: "success", data });
    expect(
      analyzerReducer(refreshed, {
        type: "rate-limited",
        requestId: 5,
        message: "Rate limit reached",
        resetAt: "2030-01-01T00:00:00.000Z",
        canRetry: true,
      })
    ).toMatchObject({ status: "rate-limited", data, resetAt: "2030-01-01T00:00:00.000Z" });
  });

  it("ignores invalid or stale lifecycle actions", () => {
    const loading = analyzerReducer(initialAnalyzerState, {
      type: "submit",
      requestId: 5,
      username: "octocat",
    });

    expect(
      analyzerReducer(loading, { type: "submit", requestId: 6, username: "torvalds" })
    ).toBe(loading);
    expect(analyzerReducer(loading, { type: "success", requestId: 4, data })).toBe(loading);
    expect(
      analyzerReducer(loading, {
        type: "error",
        requestId: 4,
        message: "Stale",
        canRetry: true,
      })
    ).toBe(loading);
    expect(
      analyzerReducer(loading, {
        type: "rate-limited",
        requestId: 4,
        message: "Stale",
        canRetry: true,
      })
    ).toBe(loading);
  });

  it("supports validation feedback, clearing errors, and reset", () => {
    const validationError = analyzerReducer(initialAnalyzerState, {
      type: "validation-error",
      message: "Please enter a GitHub username.",
    });

    expect(validationError).toMatchObject({
      status: "error",
      message: "Please enter a GitHub username.",
      canRetry: false,
    });
    expect(analyzerReducer(validationError, { type: "clear-error" })).toEqual(
      initialAnalyzerState
    );
    expect(analyzerReducer(validationError, { type: "reset" })).toEqual(initialAnalyzerState);
  });
});
