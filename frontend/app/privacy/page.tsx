import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy & Data Handling | OpenSourceMate",
  description:
    "Learn how OpenSourceMate reads public GitHub data, our strict policy against accessing private repositories, and how caching and storage work.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#05070d] text-white selection:bg-purple-500/30">
      {/* Background decoration */}
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]"
        aria-hidden="true"
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#05070d]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-3 font-semibold tracking-tight transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded-lg p-1"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-600/30">
              ✦
            </div>
            <span className="text-lg">OpenSourceMate</span>
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative mx-auto max-w-4xl px-6 py-12 sm:py-16">
        <div className="mb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-medium text-purple-300">
            Transparent & Open
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Privacy & Data Handling Policy
          </h1>
          <p className="mt-4 text-base text-gray-400 sm:text-lg">
            OpenSourceMate is built on principles of privacy and minimal data exposure.
            We explain here exactly what information is accessed, how it is processed, and what is stored.
          </p>
        </div>

        <div className="space-y-10 text-gray-300">
          {/* Section 1 */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white sm:text-2xl flex items-center gap-3">
              <span className="text-purple-400">01.</span> Public GitHub Data Only
            </h2>
            <div className="mt-4 space-y-3 leading-relaxed text-sm sm:text-base">
              <p>
                OpenSourceMate operates strictly using <strong>GitHub’s public REST API v3</strong>.
                When you enter a GitHub username, the backend reads only public information, including:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-400">
                <li>Public user profile (username, display name, public bio, avatar URL, follower and following counts)</li>
                <li>Public repository list and metadata (names, languages, descriptions, star counts, fork status)</li>
                <li>Language byte breakdown from public repositories</li>
                <li>Public manifest files (e.g. package.json or pyproject.toml) from top repositories for framework detection</li>
              </ul>
              <p className="pt-2 text-emerald-400 font-medium">
                ✓ No GitHub user account or login is required to use OpenSourceMate.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white sm:text-2xl flex items-center gap-3">
              <span className="text-purple-400">02.</span> Zero Access to Private Repositories
            </h2>
            <div className="mt-4 space-y-3 leading-relaxed text-sm sm:text-base">
              <p>
                We do not request OAuth read/write authorizations for your personal account.
                Because OpenSourceMate queries unauthenticated or server-authenticated public endpoints,
                <strong> private repositories are never accessed, read, analyzed, or indexed</strong> under any circumstances.
              </p>
              <p>
                If you have private repositories or organizations with restricted visibility, they remain completely invisible to OpenSourceMate.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white sm:text-2xl flex items-center gap-3">
              <span className="text-purple-400">03.</span> Temporary In-Memory Caching (No Persistent Database)
            </h2>
            <div className="mt-4 space-y-3 leading-relaxed text-sm sm:text-base">
              <p>
                OpenSourceMate has <strong>no persistent database</strong> (such as PostgreSQL, MySQL, or MongoDB) storing personal profiles.
              </p>
              <p>
                To respect GitHub’s API rate limits and deliver snappy response times for repeat searches, API responses are stored in a volatile, in-memory cache (<code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-purple-300">TTLCache</code>) for up to <strong>300 seconds (5 minutes)</strong>. After this TTL expires, cached data is automatically evicted from server memory.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white sm:text-2xl flex items-center gap-3">
              <span className="text-purple-400">04.</span> Client-Side Browser Storage
            </h2>
            <div className="mt-4 space-y-3 leading-relaxed text-sm sm:text-base">
              <p>
                For your personal browsing convenience, the frontend application stores certain preferences entirely inside your web browser’s local storage (<code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-purple-300">localStorage</code>):
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-400">
                <li><strong>Recent Searches:</strong> Your last few analyzed usernames. You can clear them at any time using the &quot;Clear&quot; button.</li>
                <li><strong>Saved Issues:</strong> Bookmarked issues you have marked to explore later.</li>
                <li><strong>Theme Preference:</strong> Dark mode or light mode setting.</li>
              </ul>
              <p>
                This data stays on your local device and is never uploaded or sent to our servers.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white sm:text-2xl flex items-center gap-3">
              <span className="text-purple-400">05.</span> AI &amp; Machine Learning Processing
            </h2>
            <div className="mt-4 space-y-3 leading-relaxed text-sm sm:text-base">
              <p>
                When AI explanation features are enabled, only public GitHub issue titles/descriptions and detected skill keywords are analyzed to formulate helpful contributor recommendations.
                Personal identity records or private code are never submitted to third-party LLMs.
              </p>
            </div>
          </section>
        </div>

        {/* Footer info */}
        <div className="mt-12 rounded-2xl border border-white/5 bg-white/[0.015] p-6 text-center text-sm text-gray-400">
          <p>
            Have questions about privacy or security? Open an issue on{" "}
            <a
              href="https://github.com/Muskankr/OpenSourceMate/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 underline hover:text-purple-300"
            >
              GitHub
            </a>{" "}
            or review our source code on{" "}
            <a
              href="https://github.com/Muskankr/OpenSourceMate"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 underline hover:text-purple-300"
            >
              GitHub Repository
            </a>
            .
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
            <Link
              href="/"
              className="text-purple-400 underline hover:text-purple-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded"
            >
              Back to Home
            </Link>
            <span>•</span>
            <Link
              href="/accessibility"
              className="text-purple-400 underline hover:text-purple-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded"
            >
              Accessibility Statement
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
