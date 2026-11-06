"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ProfileComparison from "../../components/ProfileComparison";

function CompareContent() {
  const searchParams = useSearchParams();
  // Support both /compare?a=user1&b=user2 and /compare?user1=user1&user2=user2
  const initialUser1 = searchParams.get("a") || searchParams.get("user1") || "";
  const initialUser2 = searchParams.get("b") || searchParams.get("user2") || "";

  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const timer = setTimeout(() => {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setTheme(prefersDark ? "dark" : "light");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
  };

  const handleUsernamesChange = (u1: string, u2: string) => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      // Clean up legacy params
      params.delete("user1");
      params.delete("user2");

      if (u1.trim()) params.set("a", u1.trim());
      else params.delete("a");

      if (u2.trim()) params.set("b", u2.trim());
      else params.delete("b");

      const queryStr = params.toString();
      const newUrl = queryStr ? `${window.location.pathname}?${queryStr}` : window.location.pathname;
      window.history.replaceState(null, "", newUrl);
    }
  };

  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen transition-colors duration-300 font-sans ${
        isDark ? "bg-[#05070d] text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Background decorative gradients */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-[-250px] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-purple-500/10 blur-[120px]" />
        <div className="absolute right-[-200px] top-[400px] h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-[100px]" />
      </div>

      {/* Header and Navigation */}
      <header
        role="banner"
        className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors duration-300 ${
          isDark ? "border-white/5 bg-[#05070d]/80" : "border-gray-200 bg-white/90"
        }`}
      >
        <nav
          aria-label="Compare navigation"
          className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5"
        >
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg transition group-hover:scale-105"
                aria-hidden="true"
              >
                ✦
              </div>
              <span className="text-lg font-semibold tracking-tight">
                OpenSourceMate
              </span>
            </Link>
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                isDark ? "bg-purple-500/10 text-purple-400" : "bg-purple-50 text-purple-700"
              }`}
            >
              Compare
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className={`text-sm font-medium transition hover:text-purple-400 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              &larr; Back to Analyzer
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                isDark
                  ? "border-white/10 bg-white/5 text-yellow-400 hover:bg-white/10"
                  : "border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {isDark ? "☼" : "☽"}
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <ProfileComparison
          initialUser1={initialUser1}
          initialUser2={initialUser2}
          theme={theme}
          onUsernamesChange={handleUsernamesChange}
        />
      </main>

      {/* Footer */}
      <footer
        className={`mt-16 border-t py-8 text-center text-xs transition-colors ${
          isDark ? "border-white/5 text-gray-500" : "border-gray-200 text-gray-400"
        }`}
      >
        <p>
          OpenSourceMate Developer Comparison • Built with Next.js &amp; Tailwind CSS
        </p>
      </footer>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#05070d] text-white">
          <p className="text-sm font-medium animate-pulse">Loading comparison tool...</p>
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
