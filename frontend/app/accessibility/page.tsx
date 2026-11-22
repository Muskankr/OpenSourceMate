import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accessibility Statement | OpenSourceMate",
  description:
    "OpenSourceMate's commitment to digital accessibility, compliance with WCAG 2.2 AA standards, known limitations, and how to report accessibility barriers.",
};

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-[#05070d] text-white selection:bg-purple-500/30">
      {/* Background radial gradient decoration */}
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]"
        aria-hidden="true"
      />

      {/* Header Landmark */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#05070d]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-3 font-semibold tracking-tight transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded-lg p-1"
            aria-label="OpenSourceMate home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-600/30">
              ✦
            </div>
            <span className="text-lg">OpenSourceMate</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/privacy"
              className="text-xs sm:text-sm text-gray-400 hover:text-white transition rounded-lg px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
            >
              Privacy Policy
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs sm:text-sm font-medium text-gray-200 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Landmark */}
      <main id="main-content" className="relative mx-auto max-w-4xl px-6 py-12 sm:py-16 outline-none" tabIndex={-1}>
        {/* Hero Section */}
        <div className="mb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-medium text-purple-300">
            Inclusive by Design
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Accessibility Statement
          </h1>
          <p className="mt-4 text-base text-gray-400 sm:text-lg leading-relaxed">
            OpenSourceMate is dedicated to ensuring digital accessibility for all software developers,
            students, and open-source contributors, regardless of disability, neurodivergence, or assistive technology setup.
          </p>
        </div>

        <div className="space-y-10 text-gray-300">
          {/* Section 1: Standard & Conformance */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-xl font-bold text-white sm:text-2xl flex items-center gap-3">
                <span className="text-purple-400">01.</span> Target Standard &amp; Conformance Status
              </h2>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-400">
                Target: WCAG 2.2 Level AA
              </span>
            </div>
            <div className="mt-4 space-y-3 leading-relaxed text-sm sm:text-base">
              <p>
                We aim to conform to the <strong>Web Content Accessibility Guidelines (WCAG) 2.2 at Level AA</strong>,
                as well as Section 508 of the U.S. Rehabilitation Act and EN 301 549 European standards.
              </p>
              <p>
                These guidelines outline best practices to make web content more accessible for people with
                a wide range of disabilities, including visual, auditory, cognitive, physical, and speech impairments.
              </p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-400">100 / 100</div>
                  <div className="text-xs text-gray-400 mt-1">Desktop Lighthouse</div>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-400">98 / 100</div>
                  <div className="text-xs text-gray-400 mt-1">Mobile (320px) Lighthouse</div>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">0 Critical</div>
                  <div className="text-xs text-gray-400 mt-1">axe-core Violations</div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Implemented Measures */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white sm:text-2xl flex items-center gap-3">
              <span className="text-purple-400">02.</span> Accessibility Features &amp; Implementation
            </h2>
            <div className="mt-4 space-y-4 leading-relaxed text-sm sm:text-base">
              <div className="border-l-2 border-purple-400 pl-4 py-1">
                <h3 className="font-semibold text-white">Full Keyboard Operability</h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  100% of interactive controls (buttons, links, inputs, theme toggles, modal drawers) can be operated via keyboard alone.
                  Includes a &quot;Skip to main content&quot; shortcut, high-contrast <code className="text-purple-300">:focus-visible</code> rings,
                  modal focus trapping, and <kbd className="rounded border border-white/20 bg-white/10 px-1 py-0.5 text-xs font-mono">Esc</kbd> key dismissal.
                </p>
              </div>

              <div className="border-l-2 border-purple-400 pl-4 py-1">
                <h3 className="font-semibold text-white">Color-Blind Safe Palette &amp; Contrast</h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  Built using the research-backed <strong>Okabe-Ito &amp; Wong categorical palette</strong>.
                  We uphold the principle that <em>&quot;Color is never the only signal&quot;</em> by pairing every chromatic status indicator
                  with geometric shapes (■, ▲, ●, ◆) and textual labels. Normal text maintains contrast ratios up to 16.5:1 against the background.
                </p>
              </div>

              <div className="border-l-2 border-purple-400 pl-4 py-1">
                <h3 className="font-semibold text-white">Semantic HTML &amp; Screen Reader Live Regions</h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  Utilizes semantic HTML landmarks (<code className="text-purple-300">&lt;header&gt;</code>, <code className="text-purple-300">&lt;main&gt;</code>, <code className="text-purple-300">&lt;nav&gt;</code>, <code className="text-purple-300">&lt;footer&gt;</code>),
                  strict heading hierarchies, explicit form labels, and ARIA live regions (<code className="text-purple-300">aria-live=&quot;polite&quot;</code> and <code className="text-purple-300">aria-live=&quot;assertive&quot;</code>)
                  for asynchronous API fetch progress and error messages.
                </p>
              </div>

              <div className="border-l-2 border-purple-400 pl-4 py-1">
                <h3 className="font-semibold text-white">Automated Continuous Testing (axe-core)</h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  Every commit and pull request runs automated accessibility checks powered by <strong>axe-core</strong> in continuous integration
                  to prevent regressions across navigation bars, hero search, repository lists, and error states.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Known Limitations */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white sm:text-2xl flex items-center gap-3">
              <span className="text-purple-400">03.</span> Known Limitations &amp; Alternative Approaches
            </h2>
            <div className="mt-4 space-y-3 leading-relaxed text-sm sm:text-base">
              <p>
                Despite our best efforts, some content or features have known constraints due to external APIs and user-generated data.
                Below is an honest account of our latest audit findings and our remediation steps:
              </p>
              <ul className="list-disc pl-6 space-y-2.5 text-gray-400">
                <li>
                  <strong className="text-gray-200">User-Generated GitHub Content:</strong> Issue titles, descriptions, and comments
                  are authored by external project maintainers. Some upstream issue bodies may lack logical heading structures or include external images
                  without meaningful alternative text. While our Markdown renderer sanitizes and disarms dangerous scripts, we cannot automatically repair upstream author prose.
                </li>
                <li>
                  <strong className="text-gray-200">External Profile Avatars:</strong> User avatars sourced from GitHub CDNs use the user&apos;s handle
                  as their accessible name. Where users lack a display name, screen readers announce the raw username.
                </li>
                <li>
                  <strong className="text-gray-200">Dense Visualizations on Narrow Devices (&lt;320px):</strong> On viewports narrower than 320px,
                  complex multi-repository comparison tables and horizontal bar charts may require scrolling or condensed views. Textual percentage representations are provided to ensure data remains perceivable.
                </li>
                <li>
                  <strong className="text-gray-200">GitHub API Rate Limit Live Announcements:</strong> When rate limits are triggered on unauthenticated sessions,
                  a banner with countdown timestamps is placed in an ARIA alert region. Certain older browser/screen reader pairings may require manual focus navigation to review the full reset guidance.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 4: Technical Specifications & Environment */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white sm:text-2xl flex items-center gap-3">
              <span className="text-purple-400">04.</span> Technical Specifications &amp; Compatibility
            </h2>
            <div className="mt-4 space-y-3 leading-relaxed text-sm sm:text-base">
              <p>
                OpenSourceMate relies on the following technologies to work with modern browsers and assistive tools:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {["HTML5", "WAI-ARIA 1.2", "CSS3 / Tailwind CSS v4", "Next.js 16 (App Router)", "React 19", "TypeScript"].map(
                  (tech) => (
                    <span
                      key={tech}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-mono text-purple-300"
                    >
                      {tech}
                    </span>
                  )
                )}
              </div>
              <p className="pt-2 text-gray-400 text-xs sm:text-sm">
                Tested against modern browsers (Chrome, Firefox, Safari, Edge) and screen readers (NVDA on Windows, VoiceOver on macOS/iOS, Orca on Linux).
              </p>
            </div>
          </section>

          {/* Section 5: Feedback & Contact */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white sm:text-2xl flex items-center gap-3">
              <span className="text-purple-400">05.</span> Feedback &amp; How to Report a Problem
            </h2>
            <div className="mt-4 space-y-3 leading-relaxed text-sm sm:text-base">
              <p>
                We welcome your feedback on the accessibility of OpenSourceMate. If you encounter accessibility barriers,
                have trouble navigating with assistive technology, or would like to suggest improvements, please reach out:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-gray-400">
                <li>
                  <strong className="text-gray-200">GitHub Issues:</strong> Open an issue labeled{" "}
                  <code className="text-purple-300">accessibility</code> on our{" "}
                  <a
                    href="https://github.com/Muskankr/OpenSourceMate/issues/new?template=bug_report.yml&title=%5BAccessibility%5D%3A+"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 underline hover:text-purple-300"
                  >
                    GitHub Issue Tracker ↗
                  </a>
                  .
                </li>
                <li>
                  <strong className="text-gray-200">Community Discussions:</strong> Share recommendations on our{" "}
                  <a
                    href="https://github.com/Muskankr/OpenSourceMate/discussions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 underline hover:text-purple-300"
                  >
                    GitHub Discussions ↗
                  </a>
                  .
                </li>
              </ul>
              <p className="pt-2 text-emerald-400 font-medium">
                We strive to review and respond to accessibility feedback within 3 to 5 business days.
              </p>
            </div>
          </section>

          {/* Section 6: Audit History & Review Date */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white sm:text-2xl flex items-center gap-3">
              <span className="text-purple-400">06.</span> Audit History &amp; Review Details
            </h2>
            <div className="mt-4 space-y-2 leading-relaxed text-sm sm:text-base text-gray-400">
              <p>
                <strong className="text-gray-200">Last Reviewed:</strong> November 2026
              </p>
              <p>
                <strong className="text-gray-200">Audit Reference:</strong> Comprehensive Accessibility &amp; Responsive Layout Audit (#11), Automated axe-core Integration (#266), Color-Blind Safe Palette (#267).
              </p>
              <p>
                <strong className="text-gray-200">Assessment Methodology:</strong> Internal self-assessment combining manual keyboard navigation protocols, screen reader verification (NVDA &amp; VoiceOver), automated CI rule checks via <code className="text-purple-300">axe-core</code>, and Chrome Lighthouse Accessibility audits.
              </p>
            </div>
          </section>
        </div>

        {/* Footer Navigation Box */}
        <div className="mt-12 rounded-2xl border border-white/5 bg-white/[0.015] p-6 text-center text-sm text-gray-400">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/"
              className="text-purple-400 underline hover:text-purple-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded"
            >
              Back to Home
            </Link>
            <span>•</span>
            <Link
              href="/privacy"
              className="text-purple-400 underline hover:text-purple-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded"
            >
              Privacy Policy
            </Link>
            <span>•</span>
            <a
              href="https://github.com/Muskankr/OpenSourceMate"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 underline hover:text-purple-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded"
            >
              GitHub Repository ↗
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
