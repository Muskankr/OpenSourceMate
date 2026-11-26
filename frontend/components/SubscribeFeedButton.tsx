"use client";

import React, { useState } from "react";
import { getAtomFeedUrl } from "../utils/apiClient";

export interface SubscribeFeedButtonProps {
  username: string;
  program?: string;
  theme?: "light" | "dark";
  variant?: "button" | "link";
  className?: string;
}

/**
 * Standard RSS / Atom feed icon
 */
export function RssFeedIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 11a9 9 0 0 1 9 9" />
      <path d="M4 4a16 16 0 0 1 16 16" />
      <circle cx="5" cy="19" r="1" fill="currentColor" />
    </svg>
  );
}

export default function SubscribeFeedButton({
  username,
  program,
  theme = "dark",
  variant = "button",
  className = "",
}: SubscribeFeedButtonProps) {
  const [copied, setCopied] = useState(false);
  const cleanUsername = username.trim().replace(/^@/, "");

  if (!cleanUsername) {
    return null;
  }

  const feedUrl = getAtomFeedUrl(cleanUsername, { program });

  const handleCopyFeedUrl = async (e: React.MouseEvent) => {
    // If user holds Alt/Ctrl/Cmd or clicks on copy trigger, copy to clipboard
    if (e.altKey || e.metaKey || e.ctrlKey) {
      e.preventDefault();
      try {
        await navigator.clipboard.writeText(feedUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback open link
        window.open(feedUrl, "_blank", "noopener,noreferrer");
      }
    }
  };

  if (variant === "link") {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <a
          href={feedUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="subscribe-feed-link"
          aria-label={`Subscribe to Atom feed of recommended issues for @${cleanUsername}`}
          title="Subscribe in your feed reader (Feedly, NetNewsWire, Thunderbird)"
          onClick={handleCopyFeedUrl}
          className={`inline-flex items-center gap-1.5 text-xs font-medium transition underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
            theme === "dark"
              ? "text-orange-400 hover:text-orange-300"
              : "text-orange-600 hover:text-orange-700"
          }`}
        >
          <RssFeedIcon className="h-3.5 w-3.5 text-orange-400" />
          <span>{copied ? "Feed URL copied!" : "Subscribe"}</span>
        </a>
      </div>
    );
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <a
        href={feedUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="subscribe-feed-link"
        aria-label={`Subscribe to Atom feed of recommended issues for @${cleanUsername}`}
        title="Subscribe to Atom feed in your feed reader (Feedly, NetNewsWire, Thunderbird)"
        onClick={handleCopyFeedUrl}
        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
          theme === "dark"
            ? "border-orange-500/20 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20 hover:text-orange-200"
            : "border-orange-300 bg-orange-50 text-orange-800 hover:bg-orange-100 shadow-sm"
        }`}
      >
        <RssFeedIcon className="h-3.5 w-3.5 text-orange-400" />
        <span>{copied ? "Feed URL copied!" : "Subscribe"}</span>
      </a>
    </div>
  );
}
