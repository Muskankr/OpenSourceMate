/**
 * Activity levels and 90-day event aggregation models (Issue #193).
 */

export type ActivityLevel = "Inactive" | "Occasional" | "Active";

export interface WeeklyActivityBucket {
  weekIndex: number;
  startDate: string;
  count: number;
  pushes: number;
  pullRequests: number;
  issues: number;
}

export interface ActivitySummary {
  username: string;
  level: ActivityLevel;
  totalEvents90d: number;
  pushesCount: number;
  pullRequestsCount: number;
  issuesCount: number;
  weeklyBuckets: WeeklyActivityBucket[];
  recentEventTimestamp?: string;
}

export interface RawGitHubEvent {
  id: string;
  type: string;
  created_at: string;
  repo?: { name: string };
  payload?: {
    size?: number;
    action?: string;
  };
}

/**
 * Computes activity levels according to documented thresholds:
 * - Active: >= 15 events in 90 days (or >= 5 in last 30 days)
 * - Occasional: 1-14 events in 90 days
 * - Inactive: 0 events in 90 days
 */
export function computeActivityLevel(totalEvents: number): ActivityLevel {
  if (totalEvents >= 15) return "Active";
  if (totalEvents >= 1) return "Occasional";
  return "Inactive";
}

/**
 * Aggregates raw GitHub events from the last 90 days into weekly buckets.
 */
export function processPublicEvents(
  username: string,
  events: RawGitHubEvent[],
  now = new Date()
): ActivitySummary {
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  // Filter events within last 90 days
  const validEvents = events.filter((e) => {
    const d = new Date(e.created_at);
    return !Number.isNaN(d.getTime()) && d >= ninetyDaysAgo && d <= now;
  });

  let pushesCount = 0;
  let pullRequestsCount = 0;
  let issuesCount = 0;

  // Initialize 12 weekly buckets (approx 84-90 days)
  const weeklyBuckets: WeeklyActivityBucket[] = Array.from({ length: 12 }, (_, i) => {
    const start = new Date(now.getTime() - (12 - i) * 7 * 24 * 60 * 60 * 1000);
    return {
      weekIndex: i + 1,
      startDate: start.toISOString().split("T")[0] || "",
      count: 0,
      pushes: 0,
      pullRequests: 0,
      issues: 0,
    };
  });

  for (const ev of validEvents) {
    const evDate = new Date(ev.created_at);
    const diffDays = Math.floor((now.getTime() - evDate.getTime()) / (1000 * 60 * 60 * 24));
    const weekIdx = Math.max(0, Math.min(11, 11 - Math.floor(diffDays / 7)));

    const bucket = weeklyBuckets[weekIdx];
    if (bucket) {
      bucket.count += 1;
      if (ev.type === "PushEvent") {
        bucket.pushes += 1;
        pushesCount += 1;
      } else if (ev.type === "PullRequestEvent") {
        bucket.pullRequests += 1;
        pullRequestsCount += 1;
      } else if (ev.type === "IssuesEvent") {
        bucket.issues += 1;
        issuesCount += 1;
      }
    }
  }

  const total = validEvents.length;

  return {
    username,
    level: computeActivityLevel(total),
    totalEvents90d: total,
    pushesCount,
    pullRequestsCount,
    issuesCount,
    weeklyBuckets,
    recentEventTimestamp: validEvents[0]?.created_at,
  };
}
