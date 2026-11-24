"use client";

import { useSyncExternalStore } from "react";
import {
  getSavedIssues,
  isIssueSaved,
  saveIssue,
  removeSavedIssue,
  toggleSaveIssue,
  updateSavedIssue,
  clearAllSavedIssues,
  exportSavedIssuesJson,
  importSavedIssuesJson,
  SAVED_ISSUES_STORAGE_KEY,
  SAVED_ISSUES_UPDATED_EVENT,
  type SavedIssue,
  type SavedIssueStatus,
  type ImportResult,
} from "../utils/savedIssuesStorage";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener("storage", callback);
  window.addEventListener(SAVED_ISSUES_UPDATED_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SAVED_ISSUES_UPDATED_EVENT, callback);
  };
}

function getSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  try {
    return localStorage.getItem(SAVED_ISSUES_STORAGE_KEY) || "[]";
  } catch {
    return "[]";
  }
}

function getServerSnapshot(): string {
  return "[]";
}

export function useSavedIssues() {
  // Subscribes to storage events so changes synchronize across tabs and components
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const savedIssues = getSavedIssues();

  return {
    savedIssues,
    count: savedIssues.length,
    isSaved: (id: number) => isIssueSaved(id),
    save: (issue: Parameters<typeof saveIssue>[0]) => saveIssue(issue),
    remove: (id: number) => removeSavedIssue(id),
    toggleSave: (issue: Parameters<typeof toggleSaveIssue>[0]) => toggleSaveIssue(issue),
    update: (id: number, updates: { note?: string; status?: SavedIssueStatus }) =>
      updateSavedIssue(id, updates),
    clearAll: () => clearAllSavedIssues(),
    exportJson: () => exportSavedIssuesJson(),
    importJson: (jsonString: string): ImportResult => importSavedIssuesJson(jsonString),
  };
}
