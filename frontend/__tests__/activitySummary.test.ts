/**
 * Unit & Component tests verifying recent public activity summary logic (Issue #193).
 */

import { render, screen } from "@testing-library/react";
import {
  computeActivityLevel,
  processPublicEvents,
  type RawGitHubEvent,
} from "../utils/activitySummary";
import ActivitySummaryCard from "../components/ActivitySummaryCard";

describe("Recent Public Activity Summary Suite (Issue #193)", () => {
  describe("computeActivityLevel", () => {
    it("returns 'Active' for 15 or more events", () => {
      expect(computeActivityLevel(15)).toBe("Active");
      expect(computeActivityLevel(50)).toBe("Active");
    });

    it("returns 'Occasional' for 1 to 14 events", () => {
      expect(computeActivityLevel(1)).toBe("Occasional");
      expect(computeActivityLevel(7)).toBe("Occasional");
      expect(computeActivityLevel(14)).toBe("Occasional");
    });

    it("returns 'Inactive' for 0 events", () => {
      expect(computeActivityLevel(0)).toBe("Inactive");
    });
  });

  describe("processPublicEvents", () => {
    const fixedNow = new Date("2026-11-06T12:00:00Z");

    it("processes recent events and distributes them across weekly buckets", () => {
      const mockEvents: RawGitHubEvent[] = [
        {
          id: "1",
          type: "PushEvent",
          created_at: "2026-11-05T10:00:00Z", // this week
        },
        {
          id: "2",
          type: "PullRequestEvent",
          created_at: "2026-10-25T10:00:00Z", // ~2 weeks ago
        },
        {
          id: "3",
          type: "IssuesEvent",
          created_at: "2026-09-15T10:00:00Z", // ~7 weeks ago
        },
        {
          id: "4",
          type: "PushEvent",
          created_at: "2025-01-01T10:00:00Z", // older than 90 days (should be ignored)
        },
      ];

      const res = processPublicEvents("octocat", mockEvents, fixedNow);
      expect(res.totalEvents90d).toBe(3);
      expect(res.pushesCount).toBe(1);
      expect(res.pullRequestsCount).toBe(1);
      expect(res.issuesCount).toBe(1);
      expect(res.level).toBe("Occasional");
      expect(res.weeklyBuckets.length).toBe(12);
    });

    it("handles users with zero recent events cleanly", () => {
      const res = processPublicEvents("quietdev", [], fixedNow);
      expect(res.totalEvents90d).toBe(0);
      expect(res.level).toBe("Inactive");
      expect(res.weeklyBuckets.length).toBe(12);
    });
  });

  describe("ActivitySummaryCard Component", () => {
    it("renders level badge and weekly bars", () => {
      const summary = processPublicEvents(
        "octocat",
        Array.from({ length: 20 }, (_, i) => ({
          id: String(i),
          type: "PushEvent",
          created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        }))
      );

      render(<ActivitySummaryCard summary={summary} />);
      expect(screen.getByText("Recent Public Activity")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("20")).toBeInTheDocument();
    });

    it("renders inactive message for users with no activity", () => {
      const summary = processPublicEvents("newbie", []);
      render(<ActivitySummaryCard summary={summary} />);
      expect(screen.getByText("Inactive")).toBeInTheDocument();
      expect(
        screen.getByText(/No public events recorded in the last 90 days/i)
      ).toBeInTheDocument();
    });
  });
});
