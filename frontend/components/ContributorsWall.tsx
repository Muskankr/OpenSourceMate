"use client";

import { memo, useEffect, useState } from "react";
import Image from "next/image";
import { isAbortError } from "../utils/apiClient";
import {
  CONTRIBUTORS_PAGE_URL,
  DEFAULT_CONTRIBUTOR_LIMIT,
  ContributorsFetchError,
  fetchContributors,
  type Contributor,
  type ContributorsErrorKind,
} from "../utils/githubContributors";

export interface ContributorsWallProps {
  theme?: "dark" | "light";
  limit?: number;
  className?: string;
}

type WallState =
  | { status: "loading" }
  | { status: "success"; contributors: Contributor[] }
  | { status: "error"; kind: ContributorsErrorKind };

const ERROR_MESSAGES: Record<ContributorsErrorKind, string> = {
  rate_limit:
    "GitHub is limiting requests right now, so the contributors list can't load. Please try again in a little while.",
  not_found: "We couldn't find the repository's contributors list.",
  network: "We couldn't reach GitHub to load contributors. Check your connection and try again.",
  unknown: "Something went wrong while loading contributors.",
};

function contributionLabel(count: number): string {
  return `${count} ${count === 1 ? "contribution" : "contributions"}`;
}

function ContributorAvatar({ login, avatarUrl }: { login: string; avatarUrl: string }) {
  const [failed, setFailed] = useState(false);

  if (!avatarUrl || failed) {
    return (
      <div
        className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-600/30 to-indigo-600/30 text-lg font-bold text-purple-200"
        role="img"
        aria-label={`${login}'s GitHub avatar`}
      >
        {login.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <Image
      src={avatarUrl}
      alt={`${login}'s GitHub avatar`}
      width={56}
      height={56}
      sizes="56px"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover"
    />
  );
}

export const ContributorsWall = memo(function ContributorsWall({
  theme = "dark",
  limit = DEFAULT_CONTRIBUTOR_LIMIT,
  className = "",
}: ContributorsWallProps) {
  const isDark = theme === "dark";
  const [state, setState] = useState<WallState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetchContributors({ limit, signal: controller.signal })
      .then((contributors) => setState({ status: "success", contributors }))
      .catch((err: unknown) => {
        if (isAbortError(err)) return;
        setState({
          status: "error",
          kind: err instanceof ContributorsFetchError ? err.kind : "unknown",
        });
      });

    return () => controller.abort();
  }, [limit, attempt]);

  const handleRetry = () => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  };

  const mutedText = isDark ? "text-gray-300" : "text-gray-600";
  const cardTone = isDark
    ? "border-white/10 bg-white/[0.035] hover:bg-white/[0.07]"
    : "border-gray-200 bg-white shadow-sm hover:bg-gray-50";

  return (
    <section
      id="contributors"
      aria-labelledby="contributors-heading"
      className={`px-4 py-16 sm:px-6 sm:py-24 ${className}`}
    >
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-400 sm:text-sm">
            COMMUNITY
          </p>
          <h2
            id="contributors-heading"
            className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl"
          >
            Built by our contributors
          </h2>
          <p className={`mx-auto mt-4 max-w-xl text-sm sm:text-base ${mutedText}`}>
            Thank you to everyone who has helped shape OpenSourceMate.
          </p>
        </div>

        <div className="mt-10" aria-live="polite" aria-busy={state.status === "loading"}>
          {state.status === "loading" && (
            <ul
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
              aria-label="Loading contributors"
            >
              {Array.from({ length: Math.min(limit, 8) }, (_, i) => (
                <li
                  key={i}
                  data-testid="contributor-skeleton"
                  className={`h-[84px] animate-pulse rounded-2xl border ${
                    isDark ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-100"
                  }`}
                />
              ))}
            </ul>
          )}

          {state.status === "error" && (
            <div
              role="status"
              className={`rounded-2xl border border-dashed p-8 text-center ${
                isDark ? "border-white/15" : "border-gray-300"
              }`}
            >
              <p className={`text-sm ${mutedText}`}>{ERROR_MESSAGES[state.kind]}</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                >
                  Try again
                </button>
                <a
                  href={CONTRIBUTORS_PAGE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded text-xs font-semibold text-purple-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                >
                  View contributors on GitHub ↗
                </a>
              </div>
            </div>
          )}

          {state.status === "success" && state.contributors.length === 0 && (
            <div
              className={`rounded-2xl border border-dashed p-8 text-center ${
                isDark ? "border-white/15" : "border-gray-300"
              }`}
            >
              <p className={`text-sm ${mutedText}`}>
                No contributors to show yet. Be the first to contribute!
              </p>
              <a
                href={CONTRIBUTORS_PAGE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block rounded text-xs font-semibold text-purple-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
              >
                View the repository ↗
              </a>
            </div>
          )}

          {state.status === "success" && state.contributors.length > 0 && (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {state.contributors.map((c) => (
                <li key={c.login}>
                  <a
                    href={c.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${c.login}, ${contributionLabel(c.contributions)}. Opens GitHub profile in a new tab`}
                    className={`flex items-center gap-3 rounded-2xl border p-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 sm:p-4 ${cardTone}`}
                  >
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 sm:h-14 sm:w-14">
                      <ContributorAvatar login={c.login} avatarUrl={c.avatarUrl} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold" title={c.login}>
                        {c.login}
                      </p>
                      <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        {contributionLabel(c.contributions)}
                      </p>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
});

export default ContributorsWall;
