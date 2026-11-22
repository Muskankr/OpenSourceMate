import React from "react";
import { render, screen } from "@testing-library/react";
import {
  isSafeUrl,
  isSafeImageUrl,
  sanitizeUrl,
  stripDangerousMarkup,
  truncateMarkdown,
  SafeMarkdown,
  renderInlineMarkdown,
} from "../utils/markdownSanitizer";

describe("Markdown Sanitizer Utility (Issue #340)", () => {
  describe("isSafeUrl & sanitizeUrl", () => {
    it("allows standard safe URLs (https, http, mailto, relative)", () => {
      expect(isSafeUrl("https://github.com/facebook/react")).toBe(true);
      expect(isSafeUrl("http://example.com/test")).toBe(true);
      expect(isSafeUrl("mailto:developer@example.org")).toBe(true);
      expect(isSafeUrl("/docs/guides")).toBe(true);
      expect(isSafeUrl("#heading-1")).toBe(true);
      expect(isSafeUrl("./relative/file.md")).toBe(true);
    });

    it("strictly blocks dangerous schemes and attack vectors", () => {
      expect(isSafeUrl("javascript:alert('XSS')")).toBe(false);
      expect(isSafeUrl("JAVASCRIPT:alert(document.cookie)")).toBe(false);
      expect(isSafeUrl("javascript:/*--></title></style></textarea></script>alert(1)")).toBe(false);
      expect(isSafeUrl("vbscript:msgbox(1)")).toBe(false);
      expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
      expect(isSafeUrl("file:///C:/Windows/system32/cmd.exe")).toBe(false);
      expect(isSafeUrl("   javascript:alert(1)  ")).toBe(false);
    });

    it("sanitizes unsafe URLs to fallback anchor", () => {
      expect(sanitizeUrl("javascript:alert(1)")).toBe("#");
      expect(sanitizeUrl("https://github.com")).toBe("https://github.com");
      expect(sanitizeUrl("javascript:alert(1)", "#custom-fallback")).toBe("#custom-fallback");
    });
  });

  describe("isSafeImageUrl", () => {
    it("allows safe image protocols and safe data:image formats", () => {
      expect(isSafeImageUrl("https://avatars.githubusercontent.com/u/100?v=4")).toBe(true);
      expect(isSafeImageUrl("data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==")).toBe(true);
      expect(isSafeImageUrl("data:image/jpeg;base64,/9j/4AAQSkZJRg==")).toBe(true);
      expect(isSafeImageUrl("data:image/webp;base64,UklGR==")).toBe(true);
    });

    it("rejects malicious image data schemes or scripts", () => {
      expect(isSafeImageUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
      expect(isSafeImageUrl("javascript:alert(1)")).toBe(false);
    });
  });

  describe("stripDangerousMarkup", () => {
    it("strips raw script, iframe, object, embed, style, and on* attributes", () => {
      const malicious = `
        Hello world!
        <script>alert('pwned')</script>
        <iframe src="https://evil.com"></iframe>
        <img src="x" onerror="alert(1)" />
        <a href="#" onclick="stealCookies()">Click me</a>
      `;
      const cleaned = stripDangerousMarkup(malicious);
      expect(cleaned).not.toContain("<script>");
      expect(cleaned).not.toContain("</script>");
      expect(cleaned).not.toContain("<iframe");
      expect(cleaned).not.toContain("onerror=");
      expect(cleaned).not.toContain("onclick=");
      expect(cleaned).toContain("Hello world!");
    });
  });

  describe("truncateMarkdown", () => {
    it("returns unchanged text when length is below maxLength", () => {
      const text = "Short body text for issue";
      const result = truncateMarkdown(text, 100);
      expect(result.isTruncated).toBe(false);
      expect(result.truncatedText).toBe(text);
      expect(result.totalLength).toBe(text.length);
    });

    it("truncates cleanly at a break point when length exceeds maxLength", () => {
      const paragraphs = [
        "First long paragraph explaining the issue in detail with many words.",
        "Second paragraph providing reproduction steps and stack trace details.",
        "Third paragraph requesting community support and maintainer feedback.",
      ].join("\n\n");

      const result = truncateMarkdown(paragraphs, 80);
      expect(result.isTruncated).toBe(true);
      expect(result.truncatedText.length).toBeLessThanOrEqual(80);
      expect(result.totalLength).toBe(paragraphs.length);
    });
  });

  describe("SafeMarkdown Component", () => {
    it("renders headings, code blocks, and lists properly", () => {
      const markdown = `
# Main Heading
## Sub Heading
### Section Title

- [ ] Task 1
- [x] Task 2
- Standard item

\`\`\`typescript
const greeting: string = "Hello world";
\`\`\`

> Important maintainer note

Normal text paragraph with **bold** and *italic* words.
      `;

      render(<SafeMarkdown content={markdown} theme="dark" />);

      expect(screen.getByText("Main Heading")).toBeInTheDocument();
      expect(screen.getByText("Sub Heading")).toBeInTheDocument();
      expect(screen.getByText("Section Title")).toBeInTheDocument();
      expect(screen.getByText("Task 1")).toBeInTheDocument();
      expect(screen.getByText("Task 2")).toBeInTheDocument();
      expect(screen.getByText("Standard item")).toBeInTheDocument();
      expect(screen.getByText('const greeting: string = "Hello world";')).toBeInTheDocument();
      expect(screen.getByText("Important maintainer note")).toBeInTheDocument();
    });

    it("renders empty state placeholder when content is empty or whitespace", () => {
      render(<SafeMarkdown content="   " theme="dark" />);
      expect(screen.getByText("No description provided.")).toBeInTheDocument();
    });

    it("safely disarms malicious XSS payloads without executing scripts", () => {
      const xssPayload = `
### Reproduction
<script>window.__XSS_TRIGGERED__ = true; alert('hacked');</script>
<img src="x" onerror="window.__XSS_IMG_TRIGGERED__ = true;" />
[Harmless Link](https://github.com)
[Malicious Link](javascript:alert('malicious'))
      `;

      const { container } = render(<SafeMarkdown content={xssPayload} theme="dark" />);

      // Ensure no raw script tag exists in DOM
      expect(container.querySelector("script")).toBeNull();
      // Ensure no onerror attribute exists on any element
      expect(container.querySelector("[onerror]")).toBeNull();
      // Ensure the safe link renders with rel="noopener noreferrer" and target="_blank"
      const safeLink = screen.getByRole("link", { name: "Harmless Link" });
      expect(safeLink).toHaveAttribute("href", "https://github.com");
      expect(safeLink).toHaveAttribute("target", "_blank");
      expect(safeLink).toHaveAttribute("rel", "noopener noreferrer");

      // Malicious link is disarmed (not an active <a> href with javascript:)
      const maliciousElements = container.querySelectorAll("a[href*='javascript']");
      expect(maliciousElements.length).toBe(0);
      expect(screen.getByText("Malicious Link")).toBeInTheDocument();
    });
  });
});
