export interface LabelGlossaryEntry {
  label: string;
  aliases?: string[];
  explanation: string;
}

/**
 * Glossary of common GitHub issue labels with plain-language explanations for newcomers.
 * Keep entries concise (one-line) so they work cleanly in tooltips and the help section.
 */
export const LABEL_GLOSSARY: LabelGlossaryEntry[] = [
  {
    label: "good first issue",
    aliases: ["good-first-issue", "good first", "starter", "beginner"],
    explanation:
      "A beginner-friendly issue with clear scope, ideal for your first contribution to this repository.",
  },
  {
    label: "first-timers-only",
    aliases: ["first timers only", "up-for-grabs"],
    explanation:
      "Reserved specifically for contributors who have never made a pull request to this project before.",
  },
  {
    label: "help wanted",
    aliases: ["help-wanted"],
    explanation:
      "Maintainers are actively looking for community contributors to pick up and solve this issue.",
  },
  {
    label: "hacktoberfest",
    explanation:
      "Eligible for Hacktoberfest; merged pull requests count toward the annual open-source event.",
  },
  {
    label: "bug",
    aliases: ["bugfix"],
    explanation: "Something is broken or behaving unexpectedly and needs a fix.",
  },
  {
    label: "enhancement",
    aliases: ["feature", "feature request"],
    explanation: "A proposal to add a new feature or improve existing functionality.",
  },
  {
    label: "documentation",
    aliases: ["docs"],
    explanation: "Improvements or additions to READMEs, guides, comments, or API docs.",
  },
  {
    label: "accessibility",
    aliases: ["a11y"],
    explanation:
      "Improves usability for keyboard navigation, screen readers, color contrast, or assistive tech.",
  },
  {
    label: "performance",
    aliases: ["perf"],
    explanation: "Focuses on making the app faster, lighter, or more memory-efficient.",
  },
  {
    label: "testing",
    aliases: ["tests", "test"],
    explanation: "Adds or fixes automated unit, integration, or end-to-end tests.",
  },
  {
    label: "gsoc",
    explanation: "Related to Google Summer of Code mentorship projects or starter tasks.",
  },
  {
    label: "outreachy",
    explanation: "Related to Outreachy internship program starter tasks or projects.",
  },
];

/**
 * Returns a plain-language explanation for a known GitHub label (case-insensitive),
 * or null if the label is not in the glossary.
 */
export function getLabelExplanation(label: string): string | null {
  if (!label || !label.trim()) return null;
  const normalized = label.trim().toLowerCase();

  for (const entry of LABEL_GLOSSARY) {
    if (entry.label.toLowerCase() === normalized) {
      return entry.explanation;
    }
    if (entry.aliases?.some((alias) => alias.toLowerCase() === normalized)) {
      return entry.explanation;
    }
  }

  return null;
}
