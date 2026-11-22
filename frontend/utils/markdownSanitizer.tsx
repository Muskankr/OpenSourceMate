import React from "react";

/**
 * Protocol allowlist for safe URLs.
 * Strictly prevents javascript:, vbscript:, data: (except image/png, image/jpeg, image/gif, image/webp), file:
 */
const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);
const ALLOWED_IMAGE_DATA_TYPES = ["data:image/png", "data:image/jpeg", "data:image/gif", "data:image/webp", "data:image/svg+xml"];

/**
 * Validates whether a URL is safe to open as a hyperlink.
 * Completely blocks dangerous schemes (e.g. javascript:, data:, vbscript:).
 */
export function isSafeUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== "string") return false;

  // Strip leading/trailing whitespace and control chars
  const sanitized = rawUrl.trim().replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
  if (!sanitized) return false;

  // Relative URLs are safe (e.g., #anchor, /path, ./relative)
  if (
    sanitized.startsWith("#") ||
    sanitized.startsWith("/") ||
    sanitized.startsWith("./") ||
    sanitized.startsWith("../")
  ) {
    return true;
  }

  try {
    const parsed = new URL(sanitized, "https://github.com");
    // Ensure the protocol is in the allowed set
    return ALLOWED_PROTOCOLS.has(parsed.protocol.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Validates whether an image URL is safe to load in an <img> tag.
 */
export function isSafeImageUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== "string") return false;
  const sanitized = rawUrl.trim().replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
  if (!sanitized) return false;

  // Check safe data:image URIs
  if (sanitized.startsWith("data:")) {
    return ALLOWED_IMAGE_DATA_TYPES.some((prefix) => sanitized.toLowerCase().startsWith(prefix));
  }

  return isSafeUrl(sanitized);
}

/**
 * Sanitizes a URL, returning a safe fallback (default: "#") if unsafe.
 */
export function sanitizeUrl(rawUrl: string, fallback: string = "#"): string {
  return isSafeUrl(rawUrl) ? rawUrl.trim() : fallback;
}

/**
 * Strips dangerous HTML tags and scripts from raw markdown text before processing.
 * Even though React renders text safely, removing script/iframe tags ensures
 * no raw markup is misunderstood by any pipeline.
 */
export function stripDangerousMarkup(input: string): string {
  if (!input) return "";
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, "")
    .replace(/on\w+\s*=\s*(?:["'][^"']*["']|[^\s>]+)/gi, "");
}

/**
 * Truncates markdown text to a maximum character count cleanly.
 */
export function truncateMarkdown(
  text: string,
  maxLength: number = 1200
): { truncatedText: string; isTruncated: boolean; totalLength: number } {
  if (!text) {
    return { truncatedText: "", isTruncated: false, totalLength: 0 };
  }

  const totalLength = text.length;
  if (totalLength <= maxLength) {
    return { truncatedText: text, isTruncated: false, totalLength };
  }

  // Find a suitable break point around maxLength (newline or space)
  let breakIndex = text.lastIndexOf("\n\n", maxLength);
  if (breakIndex === -1 || breakIndex < maxLength * 0.6) {
    breakIndex = text.lastIndexOf("\n", maxLength);
  }
  if (breakIndex === -1 || breakIndex < maxLength * 0.6) {
    breakIndex = text.lastIndexOf(" ", maxLength);
  }
  if (breakIndex === -1) {
    breakIndex = maxLength;
  }

  return {
    truncatedText: text.slice(0, breakIndex).trimEnd(),
    isTruncated: true,
    totalLength,
  };
}

/**
 * Parses inline markdown (bold, italic, strikethrough, inline code, links, images)
 * into an array of ReactNodes safely.
 */
export function renderInlineMarkdown(text: string, isDark: boolean = true): React.ReactNode[] {
  if (!text) return [];

  const nodes: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  // Regex matching inline tokens:
  // 1: Images ![alt](url)
  // 2: Links [text](url)
  // 3: Inline code `code`
  // 4: Bold **bold** or __bold__
  // 5: Italic *italic* or _italic_
  // 6: Strikethrough ~~strike~~
  const inlineRegex =
    /(!\[([^\]]*)\]\(([^)]+)\))|(\[([^\]]+)\]\(([^)]+)\))|(`([^`]+)`)|(\*\*([^*]+)\*\*|__([^_]+)__)|(\*([^*]+)\*|_([^_]+)_)|(~~([^~]+)~~)/;

  while (remaining.length > 0) {
    const match = remaining.match(inlineRegex);

    if (!match || match.index === undefined) {
      nodes.push(remaining);
      break;
    }

    // Push preceding text
    if (match.index > 0) {
      nodes.push(remaining.substring(0, match.index));
    }

    const matchedStr = match[0];
    const matchIdx = match.index;

    if (matchedStr.startsWith("![")) {
      // Image: ![alt](url)
      const alt = match[2] || "image";
      const src = match[3] || "";
      if (isSafeImageUrl(src)) {
        nodes.push(
          <span key={`img-${keyIdx++}`} className="my-2 block">
            <img
              src={src}
              alt={alt}
              loading="lazy"
              className="max-h-96 max-w-full rounded-lg border border-white/10 shadow-sm object-contain"
            />
            {alt && <span className="block mt-1 text-xs text-gray-400 italic">{alt}</span>}
          </span>
        );
      } else {
        nodes.push(
          <span
            key={`img-unsafe-${keyIdx++}`}
            className="text-xs text-amber-400 italic border border-amber-500/20 px-2 py-0.5 rounded"
          >
            [Blocked unsafe image: {alt}]
          </span>
        );
      }
    } else if (matchedStr.startsWith("[")) {
      // Link: [text](url)
      const linkText = match[5] || "";
      const rawHref = match[6] || "#";
      const isSafe = isSafeUrl(rawHref);

      if (isSafe) {
        nodes.push(
          <a
            key={`link-${keyIdx++}`}
            href={rawHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`underline underline-offset-2 transition ${
              isDark ? "text-purple-400 hover:text-purple-300" : "text-purple-600 hover:text-purple-800"
            }`}
          >
            {linkText}
          </a>
        );
      } else {
        // Disarmed unsafe link
        nodes.push(
          <span
            key={`link-unsafe-${keyIdx++}`}
            className="text-red-400 line-through cursor-not-allowed text-xs"
            title="Blocked unsafe link (disallowed protocol)"
          >
            {linkText}
          </span>
        );
      }
    } else if (matchedStr.startsWith("`")) {
      // Inline code: `code`
      const code = match[8] || "";
      nodes.push(
        <code
          key={`code-${keyIdx++}`}
          className={`rounded px-1.5 py-0.5 font-mono text-[13px] ${
            isDark ? "bg-white/10 text-purple-300" : "bg-gray-100 text-purple-700"
          }`}
        >
          {code}
        </code>
      );
    } else if (matchedStr.startsWith("**") || matchedStr.startsWith("__")) {
      // Bold: **text** or __text__
      const boldText = match[10] || match[11] || "";
      nodes.push(<strong key={`bold-${keyIdx++}`} className="font-semibold">{boldText}</strong>);
    } else if (matchedStr.startsWith("*") || matchedStr.startsWith("_")) {
      // Italic: *text* or _text_
      const italicText = match[13] || match[14] || "";
      nodes.push(<em key={`italic-${keyIdx++}`} className="italic">{italicText}</em>);
    } else if (matchedStr.startsWith("~~")) {
      // Strikethrough: ~~text~~
      const strikeText = match[16] || "";
      nodes.push(<del key={`del-${keyIdx++}`} className="line-through">{strikeText}</del>);
    }

    remaining = remaining.substring(matchIdx + matchedStr.length);
  }

  return nodes;
}

/**
 * Safe Markdown renderer component that parses markdown blocks and safely renders them.
 * Built with zero external dependencies to prevent XSS and bundle bloat.
 */
export function SafeMarkdown({
  content,
  theme = "dark",
  className = "",
}: {
  content: string;
  theme?: "dark" | "light";
  className?: string;
}) {
  const isDark = theme === "dark";

  if (!content || !content.trim()) {
    return (
      <div className={`text-sm italic ${isDark ? "text-gray-400" : "text-gray-500"}`}>
        No description provided.
      </div>
    );
  }

  // Pre-strip dangerous markup (<script>, <iframe>, on*= attributes)
  const cleanedContent = stripDangerousMarkup(content);
  const lines = cleanedContent.split("\n");
  const elements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBlockLang = "";
  let codeBlockBuffer: string[] = [];
  let inUnorderedList = false;
  let unorderedListItems: React.ReactNode[] = [];
  let inOrderedList = false;
  let orderedListItems: React.ReactNode[] = [];

  const flushLists = () => {
    if (inUnorderedList && unorderedListItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-2.5 ml-5 list-disc space-y-1 text-sm">
          {unorderedListItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      );
      unorderedListItems = [];
      inUnorderedList = false;
    }

    if (inOrderedList && orderedListItems.length > 0) {
      elements.push(
        <ol key={`ol-${elements.length}`} className="my-2.5 ml-5 list-decimal space-y-1 text-sm">
          {orderedListItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {item}
            </li>
          ))}
        </ol>
      );
      orderedListItems = [];
      inOrderedList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fenced Code Block start/end
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        // End code block
        elements.push(
          <div
            key={`codeblock-${elements.length}`}
            className={`my-3 overflow-hidden rounded-xl border text-xs ${
              isDark ? "border-white/10 bg-black/40" : "border-gray-200 bg-gray-900 text-gray-100"
            }`}
          >
            {codeBlockLang && (
              <div
                className={`flex items-center justify-between border-b px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-wider ${
                  isDark
                    ? "border-white/10 bg-white/5 text-gray-400"
                    : "border-gray-800 bg-gray-800 text-gray-400"
                }`}
              >
                <span>{codeBlockLang}</span>
              </div>
            )}
            <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed">
              <code>{codeBlockBuffer.join("\n")}</code>
            </pre>
          </div>
        );
        inCodeBlock = false;
        codeBlockLang = "";
        codeBlockBuffer = [];
      } else {
        flushLists();
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
        codeBlockBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(line);
      continue;
    }

    // Unordered List Items (- or * or task list)
    const ulMatch = line.match(/^(\s*)[-*]\s+(.+)$/);
    if (ulMatch) {
      if (inOrderedList) flushLists();
      inUnorderedList = true;
      const rawText = ulMatch[2];
      // Check for task list checkboxes
      if (rawText.startsWith("[ ] ") || rawText.startsWith("[x] ") || rawText.startsWith("[X] ")) {
        const isChecked = rawText.startsWith("[x] ") || rawText.startsWith("[X] ");
        const itemText = rawText.substring(4);
        unorderedListItems.push(
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isChecked}
              disabled
              className="h-3.5 w-3.5 rounded border-gray-400 text-purple-600 focus:ring-0"
            />
            <span>{renderInlineMarkdown(itemText, isDark)}</span>
          </div>
        );
      } else {
        unorderedListItems.push(renderInlineMarkdown(rawText, isDark));
      }
      continue;
    }

    // Ordered List Items (1. , 2. )
    const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
    if (olMatch) {
      if (inUnorderedList) flushLists();
      inOrderedList = true;
      orderedListItems.push(renderInlineMarkdown(olMatch[2], isDark));
      continue;
    }

    // Non-list line: flush any pending lists
    flushLists();

    const trimmed = line.trim();

    // Empty lines
    if (!trimmed) {
      continue;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3
          key={`h3-${elements.length}`}
          className={`mt-4 mb-2 text-base font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
        >
          {renderInlineMarkdown(trimmed.slice(4), isDark)}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h2
          key={`h2-${elements.length}`}
          className={`mt-5 mb-2 text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
        >
          {renderInlineMarkdown(trimmed.slice(3), isDark)}
        </h2>
      );
      continue;
    }
    if (trimmed.startsWith("# ")) {
      elements.push(
        <h1
          key={`h1-${elements.length}`}
          className={`mt-6 mb-3 text-xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}
        >
          {renderInlineMarkdown(trimmed.slice(2), isDark)}
        </h1>
      );
      continue;
    }
    if (trimmed.startsWith("#### ")) {
      elements.push(
        <h4
          key={`h4-${elements.length}`}
          className={`mt-3 mb-1.5 text-sm font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}
        >
          {renderInlineMarkdown(trimmed.slice(5), isDark)}
        </h4>
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote
          key={`quote-${elements.length}`}
          className={`my-3 border-l-4 pl-4 py-1 text-sm italic ${
            isDark ? "border-purple-400 bg-purple-500/5 text-gray-300" : "border-purple-500 bg-purple-50 text-gray-700"
          }`}
        >
          {renderInlineMarkdown(trimmed.slice(2), isDark)}
        </blockquote>
      );
      continue;
    }

    // Horizontal Rule
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      elements.push(
        <hr
          key={`hr-${elements.length}`}
          className={`my-4 border-t ${isDark ? "border-white/10" : "border-gray-200"}`}
        />
      );
      continue;
    }

    // Standard Paragraph
    elements.push(
      <p
        key={`p-${elements.length}`}
        className={`my-2 text-sm leading-relaxed ${isDark ? "text-gray-300" : "text-gray-700"}`}
      >
        {renderInlineMarkdown(trimmed, isDark)}
      </p>
    );
  }

  // Flush any final open list
  flushLists();

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
}
