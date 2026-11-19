import { act, renderHook } from "@testing-library/react";
import type { IssueRecommendation } from "../types/api";
import {
  hiddenIssueId,
  parseHiddenIssueIds,
  useHiddenIssues,
} from "../hooks/useHiddenIssues";

const issue = {
  id: 42,
  repository: "octocat/hello-world",
  url: "https://github.com/octocat/hello-world/issues/42",
  title: "Fix timeout",
} as IssueRecommendation;

beforeEach(() => window.localStorage.clear());

it("uses a stable repository-qualified issue ID and rejects corrupt storage", () => {
  expect(hiddenIssueId(issue)).toBe("octocat/hello-world#42");
  expect(hiddenIssueId({ ...issue, repository: "other/repo" })).not.toBe(hiddenIssueId(issue));
  expect(parseHiddenIssueIds("not JSON")).toEqual([]);
  expect(parseHiddenIssueIds('{"id": 42}')).toEqual([]);
  expect(parseHiddenIssueIds('["a", "a", 1, null, "b"]')).toEqual(["a", "b"]);
});

it("persists hiding and restoration independently of bookmarks", () => {
  window.localStorage.setItem("opensourcemate_saved_issues", '[{"id":42}]');
  const { result, unmount } = renderHook(useHiddenIssues);

  act(() => result.current.hideIssue(issue));
  expect(result.current.isHidden(issue)).toBe(true);
  expect(window.localStorage.getItem("opensourcemate_saved_issues")).toBe('[{"id":42}]');

  unmount();
  const reloaded = renderHook(useHiddenIssues);
  expect(reloaded.result.current.isHidden(issue)).toBe(true);
  act(() => reloaded.result.current.restoreIssue(issue));
  expect(reloaded.result.current.isHidden(issue)).toBe(false);
});
