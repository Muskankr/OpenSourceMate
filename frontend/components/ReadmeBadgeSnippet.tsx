"use client";

import React, { useState } from "react";
import {
  getSkillBadgeUrl,
  getSkillBadgeMarkdownSnippet,
  getSkillBadgeHtmlSnippet,
} from "../utils/apiClient";

export interface ReadmeBadgeSnippetProps {
  username: string;
  theme?: "light" | "dark";
  className?: string;
}

export default function ReadmeBadgeSnippet({
  username,
  theme = "dark",
  className = "",
}: ReadmeBadgeSnippetProps) {
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<"markdown" | "html">("markdown");
  const [labelStyle, setLabelStyle] = useState<"brand" | "skills">("brand");

  const cleanUsername = username.trim().replace(/^@/, "");

  if (!cleanUsername) {
    return null;
  }

  const labelParam = labelStyle === "skills" ? "Skills" : undefined;
  const badgeUrl = getSkillBadgeUrl(cleanUsername, { label: labelParam });
  const snippet =
    format === "markdown"
      ? getSkillBadgeMarkdownSnippet(cleanUsername, { label: labelParam })
      : getSkillBadgeHtmlSnippet(cleanUsername, { label: labelParam });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      data-testid="readme-badge-snippet-container"
      className={`rounded-2xl border p-5 transition ${
        theme === "dark"
          ? "border-purple-500/20 bg-purple-500/[0.04]"
          : "border-purple-200 bg-purple-50/50 shadow-sm"
      } ${className}`}
    >
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-base">
              🛡️
            </span>
            <h4 className="text-sm font-bold tracking-tight">GitHub Profile README Badge</h4>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                theme === "dark"
                  ? "bg-purple-500/20 text-purple-300"
                  : "bg-purple-100 text-purple-700"
              }`}
            >
              SVG
            </span>
          </div>
          <p className={`mt-1 text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
            Showcase your top detected skills on your GitHub profile README.
          </p>
        </div>

        {/* Live Badge Preview */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span
            className={`text-[11px] font-medium ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Preview:
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={badgeUrl}
            alt="OpenSourceMate Skills Badge Preview"
            data-testid="badge-preview-image"
            className="h-5 rounded"
          />
        </div>
      </div>

      {/* Options Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-purple-400/10 pt-3">
        <div className="flex items-center gap-2 text-xs">
          <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>Format:</span>
          <div className="inline-flex rounded-lg border border-white/10 p-0.5">
            <button
              type="button"
              onClick={() => setFormat("markdown")}
              className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
                format === "markdown"
                  ? "bg-purple-600 text-white shadow-sm"
                  : theme === "dark"
                    ? "text-gray-400 hover:text-white"
                    : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Markdown
            </button>
            <button
              type="button"
              onClick={() => setFormat("html")}
              className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
                format === "html"
                  ? "bg-purple-600 text-white shadow-sm"
                  : theme === "dark"
                    ? "text-gray-400 hover:text-white"
                    : "text-gray-600 hover:text-gray-900"
              }`}
            >
              HTML
            </button>
          </div>

          <span className={`ml-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Label:
          </span>
          <div className="inline-flex rounded-lg border border-white/10 p-0.5">
            <button
              type="button"
              onClick={() => setLabelStyle("brand")}
              className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
                labelStyle === "brand"
                  ? "bg-purple-600 text-white shadow-sm"
                  : theme === "dark"
                    ? "text-gray-400 hover:text-white"
                    : "text-gray-600 hover:text-gray-900"
              }`}
            >
              OpenSourceMate
            </button>
            <button
              type="button"
              onClick={() => setLabelStyle("skills")}
              className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
                labelStyle === "skills"
                  ? "bg-purple-600 text-white shadow-sm"
                  : theme === "dark"
                    ? "text-gray-400 hover:text-white"
                    : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Skills
            </button>
          </div>
        </div>

        <button
          type="button"
          data-testid="copy-badge-snippet-btn"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
        >
          <span>
            {copied ? "✓ Copied!" : `Copy ${format === "markdown" ? "Markdown" : "HTML"}`}
          </span>
        </button>
      </div>

      {/* Snippet Code Box */}
      <div className="mt-3 relative">
        <pre
          data-testid="badge-snippet-code"
          className={`overflow-x-auto rounded-xl p-3 font-mono text-xs ${
            theme === "dark"
              ? "border border-white/10 bg-black/40 text-purple-200"
              : "border border-purple-200 bg-white text-purple-900"
          }`}
        >
          <code>{snippet}</code>
        </pre>
      </div>
    </div>
  );
}
