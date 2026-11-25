"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { IssueRecommendation } from "../types/api";

export const STORAGE_KEY = "opensourcemate_hidden_issue_ids";
export const STORAGE_VERSION = 1;
export const MAX_HIDDEN_ISSUES = 200;
export const UPDATE_EVENT = "osm_hidden_issues_updated";

/** Versioned schema for storing rejected / hidden issue IDs in browser localStorage. */
export interface HiddenIssuesStorageSchema {
  version: number;
  ids: string[];
  updatedAt?: number;
}

/** Repository plus issue ID avoids collisions between different repositories. */
export function hiddenIssueId(issue: IssueRecommendation): string {
  return issue.id != null
    ? `${issue.repository}#${issue.id}`
    : `${issue.url}#${issue.title}`;
}

/**
 * Safely parses hidden issue IDs from localStorage.
 * Handles versioned schema ({ version: 1, ids: [...] }) and legacy array payloads.
 * Strictly ignores corrupt/invalid data and caps the returned list at MAX_HIDDEN_ISSUES.
 */
export function parseHiddenIssueIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    let rawIds: unknown[] = [];

    if (parsed && typeof parsed === "object") {
      if (Array.isArray(parsed)) {
        // Legacy format: raw array of strings
        rawIds = parsed;
      } else {
        const schema = parsed as Partial<HiddenIssuesStorageSchema>;
        // Versioned schema validation
        if (typeof schema.version === "number" && Array.isArray(schema.ids)) {
          rawIds = schema.ids;
        }
      }
    }

    const uniqueValid = [
      ...new Set(
        rawIds.filter(
          (value): value is string =>
            typeof value === "string" && value.trim().length > 0
        )
      ),
    ];

    return uniqueValid.slice(0, MAX_HIDDEN_ISSUES);
  } catch {
    // Malformed JSON or unexpected storage data: ignore corrupt data without crashing
    return [];
  }
}

/**
 * Serializes hidden issue IDs into a versioned schema string capped at MAX_HIDDEN_ISSUES.
 */
export function serializeHiddenIssues(ids: string[]): string {
  const cleanIds = [
    ...new Set(
      ids.filter(
        (id): id is string => typeof id === "string" && id.trim().length > 0
      )
    ),
  ].slice(0, MAX_HIDDEN_ISSUES);

  const payload: HiddenIssuesStorageSchema = {
    version: STORAGE_VERSION,
    ids: cleanIds,
    updatedAt: Date.now(),
  };

  return JSON.stringify(payload);
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
    return window.localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function useHiddenIssues() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => "");
  const hiddenIds = useMemo(() => parseHiddenIssueIds(raw), [raw]);

  const update = (issue: IssueRecommendation, hide: boolean) => {
    try {
      const current = parseHiddenIssueIds(window.localStorage.getItem(STORAGE_KEY));
      const id = hiddenIssueId(issue);
      const next = hide
        ? [id, ...current.filter((value) => value !== id)].slice(0, MAX_HIDDEN_ISSUES)
        : current.filter((value) => value !== id);

      window.localStorage.setItem(STORAGE_KEY, serializeHiddenIssues(next));
      window.dispatchEvent(new Event(UPDATE_EVENT));
    } catch {
      // Browsers can block localStorage (e.g. private mode / quota); keep card usable.
    }
  };

  const clearAll = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, serializeHiddenIssues([]));
      window.dispatchEvent(new Event(UPDATE_EVENT));
    } catch {
      // Ignore storage errors
    }
  };

  return {
    hiddenIds,
    count: hiddenIds.length,
    isHidden: (issue: IssueRecommendation) => hiddenIds.includes(hiddenIssueId(issue)),
    hideIssue: (issue: IssueRecommendation) => update(issue, true),
    restoreIssue: (issue: IssueRecommendation) => update(issue, false),
    clearAll,
    clearAllHiddenIssues: clearAll,
  };
}
