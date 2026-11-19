import Link from "next/link";
import React from "react";

interface ResourceLink {
  title: string;
  source: string;
  url: string;
  description: string;
  type: "official" | "tutorial" | "guide";
}

interface ResourceCategory {
  id: string;
  badge: string;
  title: string;
  icon: string;
  summary: string;
  proTips: string[];
  links: ResourceLink[];
}

const RESOURCE_CATEGORIES: ResourceCategory[] = [
  {
    id: "git-basics",
    badge: "Foundations",
    icon: "🌱",
    title: "1. Git Basics & Version Control",
    summary:
      "Git is the distributed version control system powering open source. Before making your first contribution, take time to understand snapshots, local staging, branching, and synchronizing with remote repositories.",
    proTips: [
      "Always create a new branch from upstream/main before writing code — never make changes directly on your fork's main branch.",
      "Use atomic commits with descriptive messages following Conventional Commits (e.g. feat:, fix:, docs:).",
      "Run git status frequently to review staged changes and ensure temporary build files remain untracked.",
    ],
    links: [
      {
        title: "Pro Git Book: Getting Started & Git Basics",
        source: "Git-SCM Official",
        url: "https://git-scm.com/book/en/v2/Getting-Started-Git-Basics",
        description:
          "The definitive official reference book on Git fundamentals, snapshots, repositories, and command-line mechanics.",
        type: "official",
      },
      {
        title: "Git & GitHub Learning Resources Directory",
        source: "GitHub Docs",
        url: "https://docs.github.com/en/get-started/start-your-journey/git-and-github-learning-resources",
        description:
          "GitHub's curated directory of official interactive cheatsheets, video tutorials, and visual version control guides.",
        type: "official",
      },
      {
        title: "Becoming a Git Guru: Version Control Tutorials",
        source: "Atlassian Git",
        url: "https://www.atlassian.com/git/tutorials/what-is-version-control",
        description:
          "Visual, beginner-friendly tutorials breaking down commits, staging areas, branches, and merging strategies.",
        type: "tutorial",
      },
    ],
  },
  {
    id: "first-pull-request",
    badge: "Hands-on",
    icon: "🚀",
    title: "2. Making Your First Pull Request",
    summary:
      "A pull request (PR) proposes your code changes to a project repository. Reviewers inspect your diff, automated continuous integration (CI) checks run tests, and maintainers merge your work once approved.",
    proTips: [
      "Keep PRs focused on a single issue or bug fix — smaller pull requests are reviewed and merged much faster.",
      "Reference the target issue in your description using keywords (e.g. 'Fixes #123') so GitHub automatically links them.",
      "Always run unit tests, linters, and formatters locally before pushing your feature branch.",
    ],
    links: [
      {
        title: "Creating a Pull Request from a Fork",
        source: "GitHub Docs",
        url: "https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork",
        description:
          "Official step-by-step instructions for opening and configuring a pull request from your personal fork to an upstream repository.",
        type: "official",
      },
      {
        title: "First Contributions Interactive Walkthrough",
        source: "First Contributions",
        url: "https://firstcontributions.github.io/",
        description:
          "A celebrated hands-on tutorial that guides newcomers through forking, branching, and submitting a test pull request in 5 minutes.",
        type: "guide",
      },
      {
        title: "How to Contribute to Open Source",
        source: "Open Source Guides (GitHub)",
        url: "https://opensource.guide/how-to-contribute/",
        description:
          "Comprehensive industry guide on the pull request lifecycle, code review etiquette, and common contribution workflows.",
        type: "guide",
      },
    ],
  },
  {
    id: "contributing-guides",
    badge: "Process",
    icon: "📖",
    title: "3. Reading & Understanding CONTRIBUTING.md",
    summary:
      "Every mature open source project provides a CONTRIBUTING.md file. It acts as the repository's rulebook, describing prerequisites, branch conventions, testing commands, issue claiming protocols, and coding standards.",
    proTips: [
      "Read the guide before writing code — projects often reject PRs that don't adhere to their specific branch or commit naming formats.",
      "Look for the local setup instructions to verify which runtime versions (Node.js, Python, etc.) are strictly required.",
      "Check whether issues must be assigned by a maintainer before work begins to avoid duplicated effort.",
    ],
    links: [
      {
        title: "Setting Guidelines for Repository Contributors",
        source: "GitHub Docs",
        url: "https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/setting-guidelines-for-repository-contributors",
        description:
          "Official GitHub documentation on what contributing guides contain and why projects require standardized workflows.",
        type: "official",
      },
      {
        title: "Writing & Understanding Contributing Guidelines",
        source: "Open Source Guides (GitHub)",
        url: "https://opensource.guide/starting-a-project/#writing-contributing-guidelines",
        description:
          "An overview of standard expectations across open source repositories, including developer setup and coding rules.",
        type: "guide",
      },
    ],
  },
  {
    id: "issue-comments",
    badge: "Communication",
    icon: "✍️",
    title: "4. Writing Good Issue Comments & Bug Reports",
    summary:
      "Clear, actionable communication saves everyone time. When opening a bug report or asking questions on an issue, maintainers need reproduction steps, system details, and sanitized logs rather than vague descriptions.",
    proTips: [
      "Format code, stack traces, and terminal logs using triple backticks (```) so they render cleanly with syntax highlighting.",
      "Never paste API keys, passwords, or personal access tokens in public issues or comments — sanitize credentials with <REDACTED>.",
      "When asking to work on an issue, briefly explain your proposed approach or relevant experience to help maintainers assign it with confidence.",
    ],
    links: [
      {
        title: "Creating and Managing Issues on GitHub",
        source: "GitHub Docs",
        url: "https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue",
        description:
          "GitHub's guide on filing actionable issues, using issue templates, and structuring discussion threads.",
        type: "official",
      },
      {
        title: "Bug Writing Guidelines & Best Practices",
        source: "Mozilla Developer Network (MDN)",
        url: "https://developer.mozilla.org/en-US/docs/MDN/Community/Contributing/Reporting_issues",
        description:
          "Industry standard recommendations for writing clear titles, step-by-step reproduction instructions, and expected vs actual outcomes.",
        type: "guide",
      },
    ],
  },
  {
    id: "maintainer-etiquette",
    badge: "Community",
    icon: "🤝",
    title: "5. Communicating with Maintainers & Etiquette",
    summary:
      "Most open source maintainers are unpaid volunteers balancing maintenance with full-time jobs. Respectful, patient, and collaborative communication builds long-term relationships and helps your contributions get merged.",
    proTips: [
      "Give maintainers a few days to review your pull request — avoid pinging or @mentioning reviewers repeatedly within hours of submission.",
      "Accept code review suggestions graciously. Reviews are an opportunity for mentorship and technical growth, not personal criticism.",
      "Abide by the repository's Code of Conduct in all discussions, pull requests, and community channels.",
    ],
    links: [
      {
        title: "Building Welcoming Open Source Communities",
        source: "Open Source Guides (GitHub)",
        url: "https://opensource.guide/building-community/",
        description:
          "Practical guidance on healthy community communication, empathy, handling disagreements, and welcoming newcomers.",
        type: "guide",
      },
      {
        title: "Contributor Covenant Code of Conduct",
        source: "Contributor Covenant",
        url: "https://www.contributor-covenant.org/",
        description:
          "The universal open source pledge establishing explicit expectations for respectful, inclusive, and professional collaboration.",
        type: "official",
      },
    ],
  },
];

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-[#05070d] text-white selection:bg-emerald-500/30">
      {/* Background radial gradient glow */}
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.12),rgba(255,255,255,0))]"
        aria-hidden="true"
      />

      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#05070d]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-3 font-semibold tracking-tight transition hover:opacity-80 rounded-lg p-1"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20">
              OS
            </div>
            <span className="text-lg bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              OpenSourceMate
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/contribute"
              className="hidden sm:inline-flex rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500/20"
            >
              Browse Issues
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 transition hover:bg-white/10"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative mx-auto max-w-5xl px-4 sm:px-6 py-12 sm:py-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-300">
            📚 Contributor Hub • Open Source 101
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-white">
            Essential Resources for{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Open Source Success
            </span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
            Starting your open source journey can feel intimidating. Here is our curated collection
            of verified guides, official documentation, and actionable best practices to help you
            navigate Git, collaborate with maintainers, and submit your first pull request with
            confidence.
          </p>

          {/* Quick Nav Pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {RESOURCE_CATEGORIES.map((cat) => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300 transition-all"
              >
                <span>{cat.icon}</span>
                <span>{cat.title.replace(/^[0-9.]+\s*/, "")}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Resource Categories */}
        <div className="space-y-12">
          {RESOURCE_CATEGORIES.map((category) => (
            <section
              key={category.id}
              id={category.id}
              className="scroll-mt-24 rounded-2xl border border-white/10 bg-slate-900/40 p-6 sm:p-8 backdrop-blur-sm transition-all hover:border-emerald-500/30"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl sm:text-3xl" aria-hidden="true">
                    {category.icon}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {category.title}
                  </h2>
                </div>
                <span className="self-start sm:self-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 text-xs font-semibold text-emerald-400">
                  {category.badge}
                </span>
              </div>

              {/* Summary */}
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
                {category.summary}
              </p>

              {/* Actionable Pro-Tips */}
              <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2.5 flex items-center gap-2">
                  <span>💡</span> Recommended Contributor Best Practices
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc list-inside">
                  {category.proTips.map((tip, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Curated Links Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/[0.03] focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90">
                          {link.source}
                        </span>
                        <span className="text-slate-500 group-hover:text-emerald-400 transition-colors">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-semibold text-white group-hover:text-emerald-300 transition-colors">
                        {link.title}
                      </h4>
                      <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                        {link.description}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center text-xs font-medium text-emerald-400 group-hover:underline">
                      Visit Resource →
                    </div>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Project Callout Banner */}
        <div className="mt-16 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 to-slate-900/60 p-6 sm:p-8 text-center backdrop-blur-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 mb-3">
            ✨ Put Knowledge into Practice
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Ready for your first contribution to OpenSourceMate?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
            Check out our beginner-friendly issues, step-by-step contribution roadmap, and
            transparent community guidelines.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/contribute"
              className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              Browse Good First Issues
            </Link>
            <a
              href="https://github.com/Muskankr/OpenSourceMate/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              OpenSourceMate Contributing Guide
            </a>
            <a
              href="https://github.com/Muskankr/OpenSourceMate/blob/main/FIRST_CONTRIBUTION.md"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              Step-by-Step First Contribution Guide
            </a>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 rounded-2xl border border-white/5 bg-white/[0.015] p-6 text-center text-xs sm:text-sm text-slate-400">
          <p>
            Have a suggestion for additional learning resources? Open an issue on our{" "}
            <a
              href="https://github.com/Muskankr/OpenSourceMate/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 underline hover:text-emerald-300"
            >
              GitHub repository
            </a>{" "}
            or start a conversation in{" "}
            <a
              href="https://github.com/Muskankr/OpenSourceMate/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 underline hover:text-emerald-300"
            >
              GitHub Discussions
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
