/**
 * Utility functions and tier styling for Newcomer-Friendliness Scoring (Issue #447).
 */

export type NewcomerTier = "Very Welcoming" | "Welcoming" | "Moderate" | "Challenging";

export interface NewcomerScoreBreakdown {
  beginner_issues_points: number;
  recent_activity_points: number;
  contributing_points: number;
  code_of_conduct_points: number;
  total_score: number;
}

/**
 * Returns Tailwind badge classes for a given friendliness tier.
 */
export function getNewcomerTierBadgeStyle(tier: string): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (tier) {
    case "Very Welcoming":
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        border: "border-emerald-500/30",
        dot: "bg-emerald-400",
      };
    case "Welcoming":
      return {
        bg: "bg-sky-500/10",
        text: "text-sky-400",
        border: "border-sky-500/30",
        dot: "bg-sky-400",
      };
    case "Moderate":
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border: "border-amber-500/30",
        dot: "bg-amber-400",
      };
    default:
      return {
        bg: "bg-slate-500/10",
        text: "text-slate-400",
        border: "border-slate-500/30",
        dot: "bg-slate-400",
      };
  }
}

/**
 * Calculates human-readable time elapsed from an ISO timestamp.
 */
export function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return "No activity recorded";
  try {
    const clean = isoString.replace("Z", "+00:00");
    const diffMs = Date.now() - new Date(clean).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "Active today";
    if (diffDays === 1) return "Active yesterday";
    if (diffDays < 30) return `Active ${diffDays}d ago`;
    if (diffDays < 365) return `Active ${Math.floor(diffDays / 30)}mo ago`;
    return `Active ${Math.floor(diffDays / 365)}y ago`;
  } catch {
    return "Recent";
  }
}
