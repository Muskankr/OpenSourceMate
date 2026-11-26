"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { IssueRecommendation } from "../types/api";

const STORAGE_KEY = "opensourcemate_hidden_issue_ids";
const UPDATE_EVENT = "osm_hidden_issues_updated";

/** Repository plus issue ID avoids collisions between different repositories. */
export function hiddenIssueId(issue: IssueRecommendation): string {
  return issue.id != null ? `${issue.repository}#${issue.id}` : `${issue.url}#${issue.title}`;
}

export function parseHiddenIssueIds(raw: string | null): string[] {
  try {
    const parsed: unknown = JSON.parse(raw || "[]");
    return Array.isArray(parsed)
      ? [...new Set(parsed.filter((value): value is string => typeof value === "string"))]
      : [];
  } catch {
    return [];
  }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(UPDATE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(UPDATE_EVENT, callback);
  };
}

function getSnapshot() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) || "[]";
  } catch {
    return "[]";
  }
}

export function useHiddenIssues() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => "[]");
  const hiddenIds = useMemo(() => parseHiddenIssueIds(raw), [raw]);

  const update = (issue: IssueRecommendation, hide: boolean) => {
    try {
      const current = parseHiddenIssueIds(window.localStorage.getItem(STORAGE_KEY));
      const id = hiddenIssueId(issue);
      const next = hide ? [...new Set([...current, id])] : current.filter((value) => value !== id);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(UPDATE_EVENT));
    } catch {
      // Browsers can block localStorage; keep the rest of the card usable.
    }
  };

  return {
    hiddenIds,
    isHidden: (issue: IssueRecommendation) => hiddenIds.includes(hiddenIssueId(issue)),
    hideIssue: (issue: IssueRecommendation) => update(issue, true),
    restoreIssue: (issue: IssueRecommendation) => update(issue, false),
  };
}
