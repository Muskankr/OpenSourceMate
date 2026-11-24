"use client";

import React, { useState } from "react";

export interface CopyBadgeButtonProps {
  username: string;
  className?: string;
}

export default function CopyBadgeButton({ username, className = "" }: CopyBadgeButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!username) return;

    // Resolve API base URL and application base URL
    const envApi = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    const currentOrigin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : "https://opensourcemate.org";

    const apiBase = envApi || currentOrigin;
    const badgeUrl = `${apiBase}/api/badge/${encodeURIComponent(username)}.svg`;
    const profileUrl = `${currentOrigin}/?user=${encodeURIComponent(username)}`;

    const badgeMarkdown = `[![OpenSourceMate Skills](${badgeUrl})](${profileUrl})`;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(badgeMarkdown);
      } else {
        // Fallback for non-secure contexts
        const textarea = document.createElement("textarea");
        textarea.value = badgeMarkdown;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy badge markdown to clipboard:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-live="polite"
      aria-label="Copy badge Markdown for GitHub profile README"
      title="Copy embeddable Markdown badge for your GitHub profile README"
      data-testid="copy-badge-markdown-btn"
      className={`inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
        copied ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" : "text-gray-200"
      } ${className}`}
    >
      {copied ? (
        <>
          <svg
            className="h-3.5 w-3.5 text-emerald-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>Badge copied!</span>
        </>
      ) : (
        <>
          <svg
            className="h-3.5 w-3.5 text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>Copy badge Markdown</span>
        </>
      )}
    </button>
  );
}
