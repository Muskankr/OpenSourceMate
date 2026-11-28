"use client";

import { memo } from "react";

export interface LazySectionPlaceholderProps {
  title?: string;
  heightClass?: string;
  theme?: "dark" | "light";
  description?: string;
}

/**
 * Lightweight placeholder displayed while lazy-loaded below-the-fold
 * components are being initialized.
 */
export const LazySectionPlaceholder = memo(function LazySectionPlaceholder({
  title = "Loading component...",
  heightClass = "h-64",
  theme = "dark",
  description = "Preparing performance-optimized view...",
}: LazySectionPlaceholderProps) {
  const isDark = theme === "dark";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full ${heightClass} flex flex-col items-center justify-center rounded-2xl border p-8 transition-colors ${
        isDark
          ? "border-white/10 bg-white/[0.02] text-gray-400"
          : "border-gray-200 bg-gray-50/50 text-gray-500"
      }`}
    >
      <div className="relative mb-4 h-10 w-10">
        <div
          className={`absolute inset-0 animate-ping rounded-full opacity-20 ${
            isDark ? "bg-purple-500" : "bg-purple-600"
          }`}
        />
        <div
          className={`h-10 w-10 animate-spin rounded-full border-2 border-t-transparent ${
            isDark
              ? "border-purple-400 border-t-transparent"
              : "border-purple-600 border-t-transparent"
          }`}
        />
      </div>
      <p className="text-sm font-semibold tracking-wide">{title}</p>
      {description && <p className="mt-1 text-xs opacity-70">{description}</p>}
      <span className="sr-only">Loading content</span>
    </div>
  );
});

export default LazySectionPlaceholder;
