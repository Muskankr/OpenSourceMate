"use client";

import React from "react";

export interface TechIconProps {
  /** Technology or language name (e.g., 'Python', 'React', 'TypeScript') */
  name: string;
  /** Active UI theme ('dark' or 'light') */
  theme?: "dark" | "light";
  /** Optional CSS classes for sizing and positioning (e.g., 'h-5 w-5') */
  className?: string;
}

/**
 * Normalizes input technology name into canonical identifier.
 */
export function normalizeTechName(name: string): string {
  const clean = name.trim().toLowerCase();
  switch (clean) {
    case "python":
    case "python3":
    case "py":
      return "python";
    case "javascript":
    case "js":
    case "ecmascript":
    case "es6":
      return "javascript";
    case "typescript":
    case "ts":
      return "typescript";
    case "html":
    case "html5":
      return "html";
    case "css":
    case "css3":
    case "scss":
    case "sass":
    case "less":
      return "css";
    case "react":
    case "reactjs":
    case "react.js":
    case "react native":
      return "react";
    case "next.js":
    case "nextjs":
    case "next":
      return "nextjs";
    case "vue":
    case "vuejs":
    case "vue.js":
    case "vue3":
    case "nuxt":
    case "nuxt.js":
    case "nuxtjs":
      return "vue";
    case "angular":
    case "angularjs":
      return "angular";
    case "svelte":
    case "sveltekit":
      return "svelte";
    case "node":
    case "node.js":
    case "nodejs":
      return "nodejs";
    case "java":
    case "jvm":
      return "java";
    case "kotlin":
    case "kt":
      return "kotlin";
    case "swift":
      return "swift";
    case "go":
    case "golang":
      return "go";
    case "rust":
      return "rust";
    case "c++":
    case "cpp":
    case "cplusplus":
      return "cpp";
    case "c":
      return "c";
    case "c#":
    case "csharp":
    case "c-sharp":
    case "dotnet":
    case ".net":
      return "csharp";
    case "ruby":
    case "rb":
    case "rails":
    case "ruby on rails":
      return "ruby";
    case "php":
      return "php";
    case "dart":
    case "flutter":
      return "dart";
    case "docker":
    case "dockerfile":
    case "container":
      return "docker";
    case "sql":
    case "postgres":
    case "postgresql":
    case "mysql":
    case "sqlite":
    case "database":
      return "sql";
    case "graphql":
      return "graphql";
    case "tailwind":
    case "tailwind css":
    case "tailwindcss":
      return "tailwind";
    case "fastapi":
      return "fastapi";
    case "django":
    case "drf":
      return "django";
    case "kubernetes":
    case "k8s":
      return "kubernetes";
    case "git":
    case "github":
    case "github actions":
      return "git";
    case "shell":
    case "bash":
    case "sh":
    case "zsh":
      return "shell";
    default:
      return "fallback";
  }
}

/**
 * TechIcon Component
 *
 * Renders inline SVG technology icons for the 25+ most common programming
 * languages and frameworks, with a neutral fallback icon for unknown skills.
 *
 * Features & Invariants:
 * - Permissively licensed (CC0 1.0 Universal / MIT) - see frontend/components/icons/LICENSE.md
 * - Inline SVGs only: zero external host queries to maintain strict Content Security Policy.
 * - Accessibility: aria-hidden="true" and focusable="false" since text label is adjacent.
 * - High contrast and readability across dark and light themes.
 */
export default function TechIcon({
  name,
  theme = "dark",
  className = "h-5 w-5 shrink-0",
}: TechIconProps) {
  const tech = normalizeTechName(name);
  const isDark = theme === "dark";

  switch (tech) {
    case "python":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          data-testid="tech-icon-python"
        >
          <path
            fill="#3776AB"
            d="M11.91 2c-3.1 0-2.91 1.34-2.91 1.34l.03 1.39h2.95v.42H6.18S4 4.9 4 8.04c0 3.14 1.9 3.04 1.9 3.04h1.13v-1.6c0-1.84 1.58-1.74 1.58-1.74h2.93c1.7 0 1.63-1.63 1.63-1.63V3.6S13.43 2 11.91 2zm-1.6 1.02a.66.66 0 1 1 0 1.32.66.66 0 0 1 0-1.32z"
          />
          <path
            fill="#FFD43B"
            d="M12.09 22c3.1 0 2.91-1.34 2.91-1.34l-.03-1.39h-2.95v-.42h5.8s2.18.25 2.18-2.89c0-3.14-1.9-3.04-1.9-3.04h-1.13v1.6c0 1.84-1.58 1.74-1.58 1.74h-2.93c-1.7 0-1.63 1.63-1.63 1.63v2.51S10.57 22 12.09 22zm1.6-1.02a.66.66 0 1 1 0-1.32.66.66 0 0 1 0 1.32z"
          />
        </svg>
      );

    case "javascript":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          data-testid="tech-icon-javascript"
        >
          <rect width="24" height="24" rx="4" fill="#F7DF1E" />
          <path
            fill="#000000"
            d="M7.5 17.2c.7.4 1.5.7 2.4.7 1.3 0 2.1-.7 2.1-1.7v-7H10v7c0 .5-.3.8-.8.8-.5 0-.9-.2-1.2-.4l-.5 1.1zm6.7.1c1.2.6 2.5 1 3.8 1 2.2 0 3.6-1.1 3.6-2.8 0-1.5-.9-2.3-2.5-3l-.8-.3c-1-.4-1.5-.8-1.5-1.4 0-.7.6-1.3 1.7-1.3.9 0 1.8.3 2.4.7l.6-1.2c-.7-.4-1.7-.7-2.9-.7-2.1 0-3.4 1.2-3.4 2.8 0 1.5 1 2.4 2.6 3l.8.3c1 .4 1.4.9 1.4 1.4 0 .8-.7 1.4-1.9 1.4-1.1 0-2.2-.4-2.8-.8l-.6 1.4z"
          />
        </svg>
      );

    case "typescript":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          data-testid="tech-icon-typescript"
        >
          <rect width="24" height="24" rx="4" fill="#3178C6" />
          <path
            fill="#FFFFFF"
            d="M5.5 8.5h6v1.8H9.7v7.2H7.3v-7.2H5.5V8.5zm8 6.4c.8.5 1.8.8 2.8.8 1.4 0 2.2-.6 2.2-1.5 0-.9-.6-1.4-1.9-1.9l-.7-.3c-1.8-.7-2.6-1.6-2.6-2.9 0-1.8 1.5-3 3.7-3 1.2 0 2.2.3 3 .8l-.7 1.6c-.6-.4-1.4-.7-2.3-.7-1.2 0-1.9.6-1.9 1.3 0 .8.6 1.2 1.8 1.7l.7.3c1.9.7 2.8 1.6 2.8 3.1 0 1.9-1.5 3.1-4 3.1-1.3 0-2.5-.4-3.4-1l.8-1.5z"
          />
        </svg>
      );

    case "html":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          data-testid="tech-icon-html"
        >
          <path
            fill="#E34F26"
            d="M3 2l1.6 18.2L12 22.4l7.4-2.2L21 2H3zm14.8 5.7h-8.2l.2 2.3h7.8l-.6 6.8-4.8 1.3-4.8-1.3-.3-3.7h2.2l.2 1.9 2.7.7 2.7-.7.3-3.4H7.4l-.6-6.6h11.2l-.2 2.7z"
          />
        </svg>
      );

    case "css":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          data-testid="tech-icon-css"
        >
          <path
            fill="#1572B6"
            d="M3 2l1.6 18.2L12 22.4l7.4-2.2L21 2H3zm14.6 5.7H9.2l.2 2.3h7.8l-.6 6.8-4.6 1.3-4.6-1.3-.3-3.7h2.2l.2 1.9 2.5.7 2.5-.7.3-3.4H7.2l-.2-2.3h9.6V7.7z"
          />
        </svg>
      );

    case "react":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          data-testid="tech-icon-react"
        >
          <circle cx="12" cy="12" r="2.2" fill="#61DAFB" />
          <g stroke="#61DAFB" strokeWidth="1.2" fill="none">
            <ellipse cx="12" cy="12" rx="9.5" ry="3.8" />
            <ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(60 12 12)" />
            <ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(120 12 12)" />
          </g>
        </svg>
      );

    case "nextjs":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          data-testid="tech-icon-nextjs"
        >
          <path
            fill={isDark ? "#FFFFFF" : "#000000"}
            d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm4.8 14.5-5.9-7.7V16H9.2V8h1.7l5.9 7.7V8h1.7v8.5z"
          />
        </svg>
      );

    case "vue":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          data-testid="tech-icon-vue"
        >
          <path fill="#42B883" d="M12 18.5 2 2h3.8L12 12.3 18.2 2H22z" />
          <path fill="#35495E" d="M12 18.5 6.7 9.5H10.5L12 12.2l1.5-2.7h3.8z" />
        </svg>
      );

    case "angular":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          data-testid="tech-icon-angular"
        >
          <path fill="#DD0031" d="M12 2.5 3 5.7l1.4 12.1L12 22.5l7.6-4.7L21 5.7z" />
          <path fill="#FFFFFF" d="m12 6.5 3.8 8.5h-1.6l-.8-2h-2.8l-.8 2H8.2zm-1 5.2h2l-1-2.5z" />
        </svg>
      );

    case "svelte":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          data-testid="tech-icon-svelte"
        >
          <path
            fill="#FF3E00"
            d="M19.4 6.7a4.9 4.9 0 0 0-4.8-4.2c-1.3 0-2.6.5-3.6 1.4L6.7 7.8A4.9 4.9 0 0 0 5 11.5c0 1.3.5 2.6 1.5 3.6l1.2 1.1-2.1 1.7a3.5 3.5 0 0 1-2.2.8 3.5 3.5 0 0 1-3.5-3.5 3.5 3.5 0 0 1 1-2.5l1.6-1.5-1.2-1.1A4.9 4.9 0 0 0 0 6.5C0 3.8 2.2 1.6 4.9 1.6c1.3 0 2.6.5 3.6 1.4l4.3 3.9a4.9 4.9 0 0 0 1.7 3.7c0 1.3-.5 2.6-1.5 3.6l-1.2 1.1 2.1-1.7a3.5 3.5 0 0 1 2.2-.8c2 0 3.5 1.6 3.5 3.5s-1.6 3.5-3.5 3.5c-1 0-1.9-.4-2.6-1.1l-1.6 1.5 1.2 1.1a4.9 4.9 0 0 0 3.6 1.4c2.7 0 4.9-2.2 4.9-4.9a4.9 4.9 0 0 0-1.7-3.7l-4.3-3.9a4.9 4.9 0 0 0-1.7-3.7c0-1.3.5-2.6 1.5-3.6l1.2-1.1-2.1 1.7a3.5 3.5 0 0 1-2.2.8c-2 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5c1 0 1.9.4 2.6 1.1l1.6-1.5-1.2-1.1z"
          />
        </svg>
      );

    case "nodejs":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          data-testid="tech-icon-nodejs"
        >
          <path
            fill="#5FA04E"
            d="M12 2 3.5 6.9v9.8L12 21.6l8.5-4.9V6.9zm-1.8 14.8h-2.1v-7.4h2.1zm4.8 0h-2.1v-4.5c0-.9-.5-1.4-1.3-1.4-.7 0-1.2.4-1.4 1v4.9h-2.1V9.4h2.1v1.1c.5-.8 1.4-1.3 2.4-1.3 1.5 0 2.4.9 2.4 2.5z"
          />
        </svg>
      );

    case "java":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          data-testid="tech-icon-java"
        >
          <path
            fill="#EA2D2E"
            d="M10.7 4c-1.3 1.8.8 3.5 1.7 4.7 1 1.3 1.2 2.2.8 3-.5 1-1.8 1.2-2.3 1.3.7.4 1.7.5 2.6.2 1.3-.4 2.1-1.6 1.5-3-.5-1.2-1.9-2.2-2.3-3.3-.4-1.1-.3-2 .5-2.9h-2.5zm4.8 3.3c-.8 1.2.5 2.4 1.1 3.2.7.9.8 1.5.5 2-.3.6-1.2.8-1.5.9.5.3 1.1.3 1.7.1.9-.3 1.4-1.1 1-2-.3-.8-1.3-1.5-1.5-2.2-.3-.7-.2-1.4.3-2z"
          />
          <path
            fill="#007396"
            d="M5.5 16.5c0 2 3.1 3.2 6.5 3.2s6.5-1.2 6.5-3.2v-1.5H5.5zm13-1h1.5c1.1 0 2 .9 2 2s-.9 2-2 2h-1.5v-4z"
          />
        </svg>
      );

    case "kotlin":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          data-testid="tech-icon-kotlin"
        >
          <path fill="#7F52FF" d="M22 22H2V2h20L12 12z" />
        </svg>
      );

    case "swift":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          data-testid="tech-icon-swift"
        >
          <path
            fill="#F05138"
            d="M21.5 15.3c-.3.4-.6.8-.9 1.2-2.8 3.3-6.9 4.9-10.9 4.4 5.3-2.6 8.3-7.5 7.8-12.7-.2-.2-.5-.4-.7-.6 1.1 2.3 1 5.1-.3 7.3-1.5 2.5-4.2 4-7.1 4.2 3.8-2.7 5.7-7.4 4.8-12.1-.1-.3-.3-.6-.5-.9.7 1.9.4 4-.8 5.6-1.5 2-4 3.1-6.5 3 2.5-1.8 3.9-4.8 3.5-7.9-.1-.3-.2-.5-.4-.8.4 1.4.1 2.9-.8 4-1.4 1.8-3.7 2.7-6 2.5 3-1.5 5.1-4.3 5.4-7.7 0-.5-.1-.9-.2-1.4 0 0-4.5 4.3-5.3 10.5-.8 5.8 3.1 11.2 8.9 12.3 5.4 1 10.8-.9 14.4-4.8z"
          />
        </svg>
      );

    case "go":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          data-testid="tech-icon-go"
        >
          <path
            fill="#00ADD8"
            d="M1.5 10.5c.3 0 .5.2.5.5v2c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-2c0-.3.2-.5.5-.5zm2-2c.3 0 .5.2.5.5v6c0 .3-.2.5-.5.5s-.5-.2-.5-.5V9c0-.3.2-.5.5-.5zm2 2c.3 0 .5.2.5.5v2c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-2c0-.3.2-.5.5-.5zm5.3-1.8c2.8 0 4.8 1.9 4.8 4.7 0 3-2.1 4.9-4.9 4.9-2.5 0-4.3-1.7-4.6-3.9h2.3c.3 1.1 1.2 1.8 2.3 1.8 1.6 0 2.6-1.2 2.6-2.8 0-1.7-1-2.7-2.6-2.7-1.1 0-2 .6-2.3 1.7H6.2c.4-2.1 2.2-3.7 4.6-3.7zm8.3 0c2.8 0 4.8 2 4.8 4.8s-2 4.8-4.8 4.8-4.8-2-4.8-4.8 2-4.8 4.8-4.8zm0 2.1c-1.5 0-2.5 1.2-2.5 2.7s1 2.7 2.5 2.7 2.5-1.2 2.5-2.7-1-2.7-2.5-2.7z"
          />
        </svg>
      );

    case "rust":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          data-testid="tech-icon-rust"
        >
          <path
            fill="#CE412B"
            d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1.6 13.5-1.4-2.3H10v2.3H8.2V8.5h4c2 0 3.2 1 3.2 2.5a2.4 2.4 0 0 1-1.6 2.3l1.8 2.7zM10 11.7h2.1c.9 0 1.5-.4 1.5-1.1 0-.8-.6-1.1-1.5-1.1H10z"
          />
        </svg>
      );

    case "cpp":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          data-testid="tech-icon-cpp"
        >
          <path
            fill="#00599C"
            d="M12 2 3.5 6.9v10.2L12 22l8.5-4.9V6.9zm-2.8 13.5a4.3 4.3 0 1 1 0-7 4.5 4.5 0 0 1 2.6.9l-1 1.4a2.9 2.9 0 0 0-1.6-.6 2.5 2.5 0 0 0 0 5 2.9 2.9 0 0 0 1.6-.6l1 1.4a4.5 4.5 0 0 1-2.6.9zm6.6-3.7h.8v1.6h-.8v.8h-1.6v-.8h-.8v-1.6h.8v-.8h1.6zm4 0h.8v1.6H20v.8h-1.6v-.8h-.8v-1.6h.8v-.8h1.6z"
          />
        </svg>
      );

    case "c":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          data-testid="tech-icon-c"
        >
          <path
            fill="#00599C"
            d="M12 2 3.5 6.9v10.2L12 22l8.5-4.9V6.9zm0 15a5.1 5.1 0 1 1 0-10.2 5.3 5.3 0 0 1 3.2 1.1l-1.3 1.8a3.3 3.3 0 0 0-1.9-.7 2.9 2.9 0 1 0 0 5.8 3.3 3.3 0 0 0 1.9-.7l1.3 1.8a5.3 5.3 0 0 1-3.2 1.1z"
          />
        </svg>
      );

    case "csharp":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          data-testid="tech-icon-csharp"
        >
          <path
            fill="#239120"
            d="M12 2 3.5 6.9v10.2L12 22l8.5-4.9V6.9zm-2.8 13.5a4.3 4.3 0 1 1 0-7 4.5 4.5 0 0 1 2.6.9l-1 1.4a2.9 2.9 0 0 0-1.6-.6 2.5 2.5 0 0 0 0 5 2.9 2.9 0 0 0 1.6-.6l1 1.4a4.5 4.5 0 0 1-2.6.9zm7.3-3.2h1.2v1h-1.2v1.5h-1v-1.5h-1.2v1.5h-1v-1.5h-.7v-1h.7v-1.2h-.7v-1h.7V9h1v1.5h1.2V9h1v1.5h1.2v1h-1.2zm-2.2 0v1.2h1.2v-1.2z"
          />
        </svg>
      );

    case "ruby":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          data-testid="tech-icon-ruby"
        >
          <path
            fill="#CC342D"
            d="M6.3 3.5 2 9.2l10 12.3 10-12.3-4.3-5.7zm1.2 1.8h9l3 4.1h-4.3l-3.2-4.1zm-1.8.8 2.8 3.3H3.8zm5.1 4.5 2.2 8.7-4.8-8.7zm2.4 0h4.8l-4.8 8.7zm5.5 0h4.7l-4.8 8.7z"
          />
        </svg>
      );

    case "php":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          data-testid="tech-icon-php"
        >
          <ellipse cx="12" cy="12" rx="10" ry="6" fill="#777BB4" />
          <path
            fill="#FFFFFF"
            d="M6 10h1.8c.8 0 1.3.4 1.3 1s-.5 1-1.3 1H7.1l-.5 2H5.4zm1.5 1.3c.4 0 .6-.2.6-.5s-.2-.5-.6-.5h-.6l-.2 1zm3.8-1.3h1.2l-.4 1.7h1.4c.8 0 1.3.4 1.3 1s-.5 1-1.3 1h-1.8l-.2 1h-1.2zm1.6 1.9c.4 0 .6-.2.6-.5s-.2-.5-.6-.5h-.5l-.2 1zm3.8-1.9h1.8c.8 0 1.3.4 1.3 1s-.5 1-1.3 1h-.7l-.5 2h-1.2zm1.5 1.3c.4 0 .6-.2.6-.5s-.2-.5-.6-.5h-.6l-.2 1z"
          />
        </svg>
      );

    case "dart":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          data-testid="tech-icon-dart"
        >
          <path
            fill="#0175C2"
            d="M4.1 3.5A2.6 2.6 0 0 0 2 6v12a2.6 2.6 0 0 0 2.1 2.5l7.9-7.9V3.5zm8.9 0-3.5 3.5 5 5 6.5-6.5a2.6 2.6 0 0 0-2.1-2zm-3.5 8.9L17.4 20a2.6 2.6 0 0 0 2.5-2.1v-5.5z"
          />
        </svg>
      );

    case "docker":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          data-testid="tech-icon-docker"
        >
          <path
            fill="#2496ED"
            d="M22.5 11.5c-.4-.3-1.3-.4-2-.2-.2-.8-.7-1.5-1.4-1.9l-.6-.4-.4.6c-.4.7-.6 1.5-.5 2.3-.6.4-1.7.4-2.4.1-.3-.1-.5 0-.7.2-1.2 1.4-3 2.1-5.6 2.1-1.2 0-2.3-.2-3.3-.6l-.4-.2-.3.4c-.6.9-1.4 1.5-2.3 1.8-.7.2-1.4.2-2.1 0a7.5 7.5 0 0 0 12.3 2.7c3.8-1.8 6.4-5.3 7-8.9zm-13-4h2.2v2H9.5zm-3 0h2.2v2H6.5zm-3 0h2.2v2H3.5zm9 0h2.2v2h-2.2zm-6-3h2.2v2H6.5zm3 0h2.2v2H9.5zm3 0h2.2v2h-2.2zm-3-3h2.2v2H9.5z"
          />
        </svg>
      );

    case "sql":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          fill="none"
          stroke="#336791"
          strokeWidth="2"
          data-testid="tech-icon-sql"
        >
          <ellipse cx="12" cy="5" rx="8" ry="3" fill="#336791" fillOpacity="0.25" />
          <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
          <path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
        </svg>
      );

    case "graphql":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          data-testid="tech-icon-graphql"
        >
          <path
            fill="#E10098"
            d="M12 2a1.8 1.8 0 0 0-1.5.8L4.3 6.6a1.8 1.8 0 0 0-.8 1.5v7.8c0 .6.3 1.2.8 1.5l6.2 3.8a1.8 1.8 0 0 0 1.8 0l6.2-3.8c.5-.3.8-.9.8-1.5V8.1a1.8 1.8 0 0 0-.8-1.5l-6.2-3.8A1.8 1.8 0 0 0 12 2zm0 2.2 5.5 3.3L12 10.9 6.5 7.5zm-6.8 5 4.8 2.8v5.8L5.2 15zm13.6 0v5.8l-4.8 2.8v-5.8z"
          />
        </svg>
      );

    case "tailwind":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          data-testid="tech-icon-tailwind"
        >
          <path
            fill="#06B6D4"
            d="M12 6c-2.4 0-3.9 1.2-4.5 3.6 1-.9 2-1.2 3.2-.8.7.2 1.2.7 1.8 1.3C13.5 11.2 15 12.7 18 12.7c2.4 0 3.9-1.2 4.5-3.6-1 .9-2 1.2-3.2.8-.7-.2-1.2-.7-1.8-1.3C16.5 7.5 15 6 12 6zm-6 6c-2.4 0-3.9 1.2-4.5 3.6 1-.9 2-1.2 3.2-.8.7.2 1.2.7 1.8 1.3C7.5 17.2 9 18.7 12 18.7c2.4 0 3.9-1.2 4.5-3.6-1 .9-2 1.2-3.2.8-.7-.2-1.2-.7-1.8-1.3C10.5 13.5 9 12 6 12z"
          />
        </svg>
      );

    case "fastapi":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          data-testid="tech-icon-fastapi"
        >
          <circle cx="12" cy="12" r="10" fill="#009688" />
          <path fill="#FFFFFF" d="M12.5 4.5 6.8 12.8h4.5l-1.3 6.7 6.7-9.5h-4.2z" />
        </svg>
      );

    case "django":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          data-testid="tech-icon-django"
        >
          <rect width="24" height="24" rx="4" fill={isDark ? "#1b4d3e" : "#092E20"} />
          <path
            fill="#FFFFFF"
            d="M11.5 6.5h2.2v7.2c0 2-1 3-3.1 3-.7 0-1.4-.2-1.9-.4l.4-1.8c.4.2.8.3 1.2.3 1.1 0 1.4-.6 1.4-1.6zm-2.4 4.5v3.8c-.3.1-.7.2-1.1.2-1.5 0-2.3-1-2.3-2.6s.8-2.6 2.3-2.6c.4 0 .8.1 1.1.2zm0-1.6c-.5-.2-1.1-.3-1.8-.3-2.4 0-4 1.7-4 4.3 0 2.5 1.5 4.2 3.9 4.2.7 0 1.3-.1 1.9-.3z"
          />
        </svg>
      );

    case "kubernetes":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          data-testid="tech-icon-kubernetes"
        >
          <path
            fill="#326CE5"
            d="M12 2 3.5 6.9v10.2L12 22l8.5-4.9V6.9zm0 3.2 5.7 3.3v6.6L12 18.4l-5.7-3.3V8.5zm0 2.2a4.4 4.4 0 1 0 4.4 4.4A4.4 4.4 0 0 0 12 7.4zm0 2.2a2.2 2.2 0 1 1-2.2 2.2 2.2 2.2 0 0 1 2.2-2.2z"
          />
        </svg>
      );

    case "git":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          data-testid="tech-icon-git"
        >
          <path
            fill="#F05032"
            d="M21.7 10.7 13.3 2.3a1.8 1.8 0 0 0-2.6 0L8.4 4.6l3.3 3.3a2.2 2.2 0 0 1 2.8 2.8l3.1 3.1a2.2 2.2 0 1 1-1.3 1.3l-2.9-2.9v4.2a2.2 2.2 0 1 1-1.8 0v-4.4a2.2 2.2 0 0 1-1.2-2.9L7.1 5.8 2.3 10.7a1.8 1.8 0 0 0 0 2.6l8.4 8.4a1.8 1.8 0 0 0 2.6 0l8.4-8.4a1.8 1.8 0 0 0 0-2.6z"
          />
        </svg>
      );

    case "shell":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
          fill="none"
          stroke={isDark ? "#A3E635" : "#4D7C0F"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          data-testid="tech-icon-shell"
        >
          <rect x="2" y="3" width="20" height="18" rx="3" stroke="currentColor" />
          <polyline points="6 9 10 12 6 15" />
          <line x1="12" y1="15" x2="17" y2="15" />
        </svg>
      );

    case "fallback":
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          className={`${className} ${isDark ? "text-gray-400" : "text-gray-600"}`}
          aria-hidden="true"
          focusable="false"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          data-testid="tech-icon-fallback"
        >
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
          <line x1="14" y1="4" x2="10" y2="20" />
        </svg>
      );
  }
}
