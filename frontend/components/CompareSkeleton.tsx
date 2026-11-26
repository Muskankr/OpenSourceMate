"use client";

import { memo } from "react";

export interface CompareSkeletonProps {
  theme?: "dark" | "light";
}

/**
 * High-fidelity layout skeleton mimicking the side-by-side profile comparison tool.
 * Prevents Cumulative Layout Shift (CLS) while client modules load.
 * Works seamlessly in both dark and light color themes.
 */
export const CompareSkeleton = memo(function CompareSkeleton({
  theme = "dark",
}: CompareSkeletonProps) {
  const isDark = theme === "dark";

  return (
    <div
      role="status"
      aria-label="Loading comparison tool skeleton"
      className={`min-h-screen w-full transition-colors ${
        isDark ? "bg-[#05070d] text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Top Navbar Skeleton */}
      <header
        className={`border-b ${
          isDark ? "border-white/10 bg-[#05070d]/80" : "border-gray-200 bg-white/80"
        } sticky top-0 z-30 px-4 py-3 backdrop-blur`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`h-7 w-7 animate-pulse rounded-lg ${
                isDark ? "bg-white/10" : "bg-gray-200"
              }`}
            />
            <div
              className={`h-5 w-32 animate-pulse rounded ${isDark ? "bg-white/10" : "bg-gray-200"}`}
            />
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`h-8 w-20 animate-pulse rounded-lg ${
                isDark ? "bg-white/10" : "bg-gray-200"
              }`}
            />
            <div
              className={`h-8 w-8 animate-pulse rounded-lg ${
                isDark ? "bg-white/10" : "bg-gray-200"
              }`}
            />
          </div>
        </div>
      </header>

      {/* Main Content Skeleton Area */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Header & Tagline Skeleton */}
        <div className="mb-10 text-center">
          <div
            className={`mx-auto mb-3 h-8 w-64 animate-pulse rounded-lg sm:h-10 sm:w-96 ${
              isDark ? "bg-white/10" : "bg-gray-200"
            }`}
          />
          <div
            className={`mx-auto h-4 w-72 animate-pulse rounded sm:w-80 ${
              isDark ? "bg-white/5" : "bg-gray-100"
            }`}
          />
        </div>

        {/* Two Input Cards Layout (Side-by-Side on Desktop, Stacked on Mobile) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Developer 1 Card Skeleton */}
          <div
            className={`rounded-2xl border p-6 transition-colors ${
              isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-white shadow-sm"
            }`}
          >
            <div className="mb-4 flex items-center gap-3">
              <div
                className={`h-12 w-12 animate-pulse rounded-2xl ${
                  isDark ? "bg-white/10" : "bg-gray-200"
                }`}
              />
              <div className="flex-1 space-y-2">
                <div
                  className={`h-4 w-28 animate-pulse rounded ${
                    isDark ? "bg-white/10" : "bg-gray-200"
                  }`}
                />
                <div
                  className={`h-3 w-40 animate-pulse rounded ${
                    isDark ? "bg-white/5" : "bg-gray-100"
                  }`}
                />
              </div>
            </div>
            {/* Input field skeleton */}
            <div
              className={`mb-4 h-11 w-full animate-pulse rounded-xl ${
                isDark ? "bg-white/5" : "bg-gray-100"
              }`}
            />
            {/* Stats chips skeleton */}
            <div className="flex gap-2">
              <div
                className={`h-7 w-20 animate-pulse rounded-lg ${
                  isDark ? "bg-white/5" : "bg-gray-100"
                }`}
              />
              <div
                className={`h-7 w-24 animate-pulse rounded-lg ${
                  isDark ? "bg-white/5" : "bg-gray-100"
                }`}
              />
              <div
                className={`h-7 w-16 animate-pulse rounded-lg ${
                  isDark ? "bg-white/5" : "bg-gray-100"
                }`}
              />
            </div>
          </div>

          {/* Developer 2 Card Skeleton */}
          <div
            className={`rounded-2xl border p-6 transition-colors ${
              isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-white shadow-sm"
            }`}
          >
            <div className="mb-4 flex items-center gap-3">
              <div
                className={`h-12 w-12 animate-pulse rounded-2xl ${
                  isDark ? "bg-white/10" : "bg-gray-200"
                }`}
              />
              <div className="flex-1 space-y-2">
                <div
                  className={`h-4 w-28 animate-pulse rounded ${
                    isDark ? "bg-white/10" : "bg-gray-200"
                  }`}
                />
                <div
                  className={`h-3 w-40 animate-pulse rounded ${
                    isDark ? "bg-white/5" : "bg-gray-100"
                  }`}
                />
              </div>
            </div>
            {/* Input field skeleton */}
            <div
              className={`mb-4 h-11 w-full animate-pulse rounded-xl ${
                isDark ? "bg-white/5" : "bg-gray-100"
              }`}
            />
            {/* Stats chips skeleton */}
            <div className="flex gap-2">
              <div
                className={`h-7 w-20 animate-pulse rounded-lg ${
                  isDark ? "bg-white/5" : "bg-gray-100"
                }`}
              />
              <div
                className={`h-7 w-24 animate-pulse rounded-lg ${
                  isDark ? "bg-white/5" : "bg-gray-100"
                }`}
              />
              <div
                className={`h-7 w-16 animate-pulse rounded-lg ${
                  isDark ? "bg-white/5" : "bg-gray-100"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Center Action Button Skeleton */}
        <div className="mt-8 flex justify-center">
          <div
            className={`h-12 w-48 animate-pulse rounded-xl ${
              isDark ? "bg-purple-600/30" : "bg-purple-600/20"
            }`}
          />
        </div>

        {/* No-JavaScript Fallback Notice */}
        <noscript>
          <div
            className="mt-8 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-center text-amber-300"
            role="alert"
          >
            <h3 className="font-semibold text-base mb-1">JavaScript is required</h3>
            <p className="text-sm text-amber-200/90">
              The Developer Profile Comparison tool requires JavaScript to analyze GitHub profiles,
              compute shared competencies, and render side-by-side metrics. Please enable JavaScript
              in your browser settings to continue.
            </p>
          </div>
        </noscript>
      </main>

      <span className="sr-only">Loading developer comparison interface...</span>
    </div>
  );
});

export default CompareSkeleton;
