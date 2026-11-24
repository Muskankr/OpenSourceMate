"use client";

import { useSavedIssues } from "./useSavedIssues";
import type { SavedIssue } from "../utils/savedIssuesStorage";

export type BookmarkedIssue = SavedIssue;

export function useBookmarkedIssues() {
  const { savedIssues, isSaved, toggleSave, remove, clearAll } = useSavedIssues();

  return {
    bookmarks: savedIssues,
    isBookmarked: isSaved,
    toggleBookmark: toggleSave,
    removeBookmark: remove,
    clearBookmarks: clearAll,
  };
}
