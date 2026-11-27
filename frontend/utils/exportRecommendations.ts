import type { IssueRecommendation } from "../types/api";

export type ExportFormat = "csv" | "markdown" | "json";

export interface ActiveFilters {
  language?: string;
  label?: string;
  difficulty?: string;
  minScore?: number;
  program?: string;
  searchQuery?: string;
  learningMode?: boolean;
  targetSkills?: string[];
  [key: string]: unknown;
}

export interface RecommendationExportOptions {
  username?: string;
  date?: string;
  filters?: ActiveFilters;
  issues: IssueRecommendation[];
}

/**
 * Escapes a cell value for CSV, preventing CSV Formula Injection (CWE-1236).
 * Prepends a single quote (') if the string begins with =, +, -, or @,
 * or if it begins after leading whitespace with one of those characters.
 * Also handles standard RFC 4180 escaping (wrapping in quotes, doubling quotes).
 */
export function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  let str = String(value);

  // Check if string begins with =, +, -, or @ (formula injection triggers)
  // Even if prefixed with tabs/spaces, spreadsheets can interpret them as formulas.
  const trimmedLeading = str.replace(/^[\s\t\r\n]+/, "");
  if (
    trimmedLeading.startsWith("=") ||
    trimmedLeading.startsWith("+") ||
    trimmedLeading.startsWith("-") ||
    trimmedLeading.startsWith("@")
  ) {
    str = `'${str}`;
  }

  // RFC 4180 escaping: if quotes, commas, or newlines are present, wrap in quotes & escape inner quotes
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Formats active filters into a human-readable list or string representation.
 */
export function formatActiveFilters(filters?: ActiveFilters): string {
  if (!filters) return "None";

  const parts: string[] = [];
  if (filters.language && filters.language !== "all") {
    parts.push(`Language: ${filters.language}`);
  }
  if (filters.label && filters.label !== "all") {
    parts.push(`Label: ${filters.label}`);
  }
  if (filters.difficulty && filters.difficulty !== "all") {
    parts.push(`Difficulty: ${filters.difficulty}`);
  }
  if (typeof filters.minScore === "number" && filters.minScore > 0) {
    parts.push(`Min Score: ${filters.minScore}`);
  }
  if (filters.program && filters.program.trim()) {
    parts.push(`Program: ${filters.program}`);
  }
  if (filters.searchQuery && filters.searchQuery.trim()) {
    parts.push(`Search: "${filters.searchQuery.trim()}"`);
  }
  if (filters.learningMode) {
    const skills = filters.targetSkills && filters.targetSkills.length > 0
      ? ` (${filters.targetSkills.join(", ")})`
      : "";
    parts.push(`Learning Mode: enabled${skills}`);
  }

  return parts.length > 0 ? parts.join("; ") : "None";
}

/**
 * Generates an RFC 4180 CSV export of recommendations with metadata header and formula escaping.
 */
export function generateRecommendationsCsv(options: RecommendationExportOptions): string {
  const exportDate = options.date || new Date().toISOString().split("T")[0];
  const user = options.username ? `@${options.username}` : "Anonymous";
  const filterSummary = formatActiveFilters(options.filters);

  const lines: string[] = [];

  // Metadata comments / header rows
  lines.push(`# OpenSourceMate Recommendations Export`);
  lines.push(`# Date: ${exportDate}`);
  lines.push(`# User: ${user}`);
  lines.push(`# Active Filters: ${filterSummary}`);
  lines.push(`# Total Issues: ${options.issues.length}`);
  lines.push("");

  // Table Columns
  lines.push("Repository,Issue Number,Title,URL,Language,Difficulty,Score,Comments,Labels");

  for (const issue of options.issues) {
    const repo = escapeCsvCell(issue.repository);
    const issueNum = escapeCsvCell(issue.id);
    const title = escapeCsvCell(issue.title);
    const url = escapeCsvCell(issue.url);
    const language = escapeCsvCell(issue.language || "Unknown");
    const difficulty = escapeCsvCell(issue.difficulty || "unspecified");
    const score = escapeCsvCell(Math.round(issue.match_score ?? issue.score ?? 0));
    const comments = escapeCsvCell(issue.comments ?? 0);
    const labels = escapeCsvCell((issue.labels || []).join(", "));

    lines.push(`${repo},${issueNum},${title},${url},${language},${difficulty},${score},${comments},${labels}`);
  }

  return lines.join("\r\n");
}

/**
 * Generates a Markdown task list export of recommendations with metadata header.
 */
export function generateRecommendationsMarkdown(options: RecommendationExportOptions): string {
  const exportDate = options.date || new Date().toISOString().split("T")[0];
  const user = options.username ? `@${options.username}` : "Anonymous";
  const filterSummary = formatActiveFilters(options.filters);

  const lines: string[] = [];

  lines.push(`# OpenSourceMate Issue Recommendations`);
  lines.push("");
  lines.push(`- **Date**: ${exportDate}`);
  lines.push(`- **User**: ${user}`);
  lines.push(`- **Active Filters**: ${filterSummary}`);
  lines.push(`- **Total Recommendations**: ${options.issues.length}`);
  lines.push("");
  lines.push("## Recommendations Task List");
  lines.push("");

  if (options.issues.length === 0) {
    lines.push("_No visible recommendations to export._");
  } else {
    for (const issue of options.issues) {
      const score = Math.round(issue.match_score ?? issue.score ?? 0);
      const languageBadge = issue.language ? `\`${issue.language}\`` : "";
      const difficultyBadge = issue.difficulty ? `[${issue.difficulty}]` : "";
      const meta = [languageBadge, difficultyBadge, `Score: ${score}%`]
        .filter(Boolean)
        .join(" • ");

      const titleClean = issue.title.replace(/[\r\n]+/g, " ").trim();
      lines.push(`- [ ] [${issue.repository}#${issue.id}: ${titleClean}](${issue.url}) - ${meta}`);
    }
  }

  lines.push("");
  lines.push("---");
  lines.push("*Generated by [OpenSourceMate](https://github.com/Muskankr/OpenSourceMate)*");

  return lines.join("\n");
}

/**
 * Generates a structured JSON export of recommendations with metadata header.
 */
export function generateRecommendationsJson(options: RecommendationExportOptions): string {
  const exportDate = options.date || new Date().toISOString().split("T")[0];

  const payload = {
    app: "OpenSourceMate",
    version: "0.1.0",
    exportedAt: exportDate,
    username: options.username || null,
    activeFilters: options.filters || {},
    activeFiltersSummary: formatActiveFilters(options.filters),
    totalCount: options.issues.length,
    recommendations: options.issues.map((issue) => ({
      id: issue.id,
      repository: issue.repository,
      title: issue.title,
      url: issue.url,
      language: issue.language || null,
      difficulty: issue.difficulty || null,
      score: Math.round(issue.match_score ?? issue.score ?? 0),
      comments: issue.comments ?? 0,
      labels: issue.labels || [],
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      reasons: issue.match_reasons || issue.reasons || [],
    })),
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Returns a standardized export filename for recommendations.
 */
export function getRecommendationsExportFilename(
  username: string | undefined,
  format: ExportFormat,
  dateStr?: string
): string {
  const sanitizedUser = (username || "recommendations")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "") || "recommendations";
  const date = dateStr || new Date().toISOString().split("T")[0];

  switch (format) {
    case "csv":
      return `opensourcemate-${sanitizedUser}-issues-${date}.csv`;
    case "markdown":
      return `opensourcemate-${sanitizedUser}-issues-${date}.md`;
    case "json":
      return `opensourcemate-${sanitizedUser}-issues-${date}.json`;
  }
}

/**
 * Returns the MIME type corresponding to the chosen format.
 */
export function getRecommendationsMimeType(format: ExportFormat): string {
  switch (format) {
    case "csv":
      return "text/csv;charset=utf-8";
    case "markdown":
      return "text/markdown;charset=utf-8";
    case "json":
      return "application/json;charset=utf-8";
  }
}

/**
 * Exports recommendation issues by generating file content and triggering a browser download.
 */
export function exportRecommendationsData(
  options: RecommendationExportOptions,
  format: ExportFormat
): void {
  let content = "";
  switch (format) {
    case "csv":
      content = generateRecommendationsCsv(options);
      break;
    case "markdown":
      content = generateRecommendationsMarkdown(options);
      break;
    case "json":
      content = generateRecommendationsJson(options);
      break;
  }

  const filename = getRecommendationsExportFilename(options.username, format, options.date);
  const mimeType = getRecommendationsMimeType(format);
  downloadRecommendationsFile(content, filename, mimeType);
}

/**
 * Downloads a string payload as a client-side file.
 */
export function downloadRecommendationsFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  if (typeof window === "undefined") return;

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
