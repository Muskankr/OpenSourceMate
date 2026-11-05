/**
 * Unit & Component tests verifying BuildVersionBadge and build version utilities (Issue #188).
 */

import { render, screen } from "@testing-library/react";
import {
  getBuildVersionInfo,
  getBuildCommitSha,
} from "../utils/buildVersion";
import BuildVersionBadge from "../components/BuildVersionBadge";

describe("Footer Build Version Suite (Issue #188)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("getBuildCommitSha & getBuildVersionInfo", () => {
    it("reports 'dev' when no commit SHA environment variable is present", () => {
      delete process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;
      delete process.env.VERCEL_GIT_COMMIT_SHA;
      delete process.env.NEXT_PUBLIC_GIT_COMMIT_SHA;
      delete process.env.GIT_COMMIT_SHA;

      const info = getBuildVersionInfo();
      expect(info.isDev).toBe(true);
      expect(info.shortSha).toBe("dev");
      expect(info.commitUrl).toBeNull();
      expect(info.commitSha).toBeNull();
    });

    it("parses full SHA and extracts first 7 characters for shortSha", () => {
      const fullSha = "4f258de1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7";
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA = fullSha;

      const sha = getBuildCommitSha();
      expect(sha).toBe(fullSha);

      const info = getBuildVersionInfo();
      expect(info.isDev).toBe(false);
      expect(info.shortSha).toBe("4f258de");
      expect(info.commitSha).toBe(fullSha);
      expect(info.commitUrl).toBe(
        `https://github.com/Muskankr/OpenSourceMate/commit/${fullSha}`
      );
    });

    it("rejects invalid or too-short commit SHA strings", () => {
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA = "123";
      expect(getBuildCommitSha()).toBeNull();
      expect(getBuildVersionInfo().shortSha).toBe("dev");
    });
  });

  describe("BuildVersionBadge Component", () => {
    it("renders 'build: dev' badge in local development mode", () => {
      delete process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;
      render(<BuildVersionBadge />);

      expect(screen.getByText("build:")).toBeInTheDocument();
      expect(screen.getByText("dev")).toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("renders clickable commit link when commit SHA is present", () => {
      const testSha = "7df1e7c987654321fedcba";
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA = testSha;

      render(<BuildVersionBadge />);
      const link = screen.getByRole("link", { name: /7df1e7c ↗/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute(
        "href",
        `https://github.com/Muskankr/OpenSourceMate/commit/${testSha}`
      );
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("applies dark and light theme styles properly", () => {
      const { rerender } = render(<BuildVersionBadge theme="dark" />);
      expect(screen.getByLabelText(/Build version:/i)).toHaveClass("text-gray-400");

      rerender(<BuildVersionBadge theme="light" />);
      expect(screen.getByLabelText(/Build version:/i)).toHaveClass("text-gray-600");
    });
  });
});


  describe("Repository URL Fallback Behavior", () => {
    it("uses NEXT_PUBLIC_GITHUB_REPO_URL when provided in environment", () => {
      const customRepo = "https://github.com/custom/repo";
      process.env.NEXT_PUBLIC_GITHUB_REPO_URL = customRepo;
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA = "abcdef1234567";

      const info = getBuildVersionInfo();
      expect(info.repositoryUrl).toBe(customRepo);
      expect(info.commitUrl).toBe(`${customRepo}/commit/abcdef1234567`);
    });

    it("handles whitespace in commit SHA strings gracefully", () => {
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA = "  1234567890abcdef  ";
      const info = getBuildVersionInfo();
      expect(info.shortSha).toBe("1234567");
    });
  });

  describe("Accessibility and Aria Attributes", () => {
    it("includes accessible aria-label with the short commit SHA", () => {
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA = "aabbccddee1122";
      render(<BuildVersionBadge />);
      expect(screen.getByLabelText("Build version: aabbccd")).toBeInTheDocument();
    });
  });


  it("handles null/undefined buildTime without throwing", () => {
    delete process.env.NEXT_PUBLIC_BUILD_TIME;
    const info = getBuildVersionInfo();
    expect(info.buildTime).toBeNull();
  });
