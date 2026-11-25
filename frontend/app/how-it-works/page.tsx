"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useTheme } from "../../hooks/useTheme";
import { ThemeSegmentedToggle } from "../../components/ThemeToggle";
import BuildVersionBadge from "../../components/BuildVersionBadge";
import GitHubLink from "../../components/GitHubLink";
import FAQ from "../../components/FAQ";
import { HOW_IT_WORKS_CONTENT } from "../../data/howItWorksContent";

export default function HowItWorksPage() {
  const { theme, themePreference, setThemePreference } = useTheme();
  const isDark = theme === "dark";

  const [activeFaqCategory, setActiveFaqCategory] = useState<string>("All");
  const [faqSearchQuery, setFaqSearchQuery] = useState<string>("");

  const content = HOW_IT_WORKS_CONTENT;

  // Filtered FAQ items based on category and search query
  const filteredFaqItems = useMemo(() => {
    return content.faq.items.filter((item) => {
      const matchesCategory =
        activeFaqCategory === "All" || item.category === activeFaqCategory;
      const matchesQuery =
        faqSearchQuery.trim() === "" ||
        item.question.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(faqSearchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [content.faq.items, activeFaqCategory, faqSearchQuery]);

  const categories = ["All", "Data & Privacy", "Skill Detection", "Issue Matching", "General"];

  return (
    <div
      className={`min-h-screen transition-colors duration-300 font-sans ${
        isDark ? "bg-[#05070d] text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Background decorative gradients */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-[-250px] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-purple-500/10 blur-[120px]" />
        <div className="absolute right-[-200px] top-[400px] h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-[100px]" />
        <div className="absolute left-[-200px] top-[900px] h-[400px] w-[400px] rounded-full bg-emerald-500/5 blur-[100px]" />
      </div>

      {/* Header and Navigation */}
      <header
        role="banner"
        className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors duration-300 ${
          isDark ? "border-white/5 bg-[#05070d]/80" : "border-gray-200 bg-white/90"
        }`}
      >
        <nav
          aria-label="How it works navigation"
          className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5"
        >
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg transition group-hover:scale-105"
                aria-hidden="true"
              >
                ✦
              </div>
              <span className="text-lg font-semibold tracking-tight">OpenSourceMate</span>
            </Link>
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                isDark ? "bg-purple-500/10 text-purple-400" : "bg-purple-50 text-purple-700"
              }`}
            >
              How It Works &amp; FAQ
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className={`text-sm font-medium transition hover:text-purple-400 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              &larr; Back to Analyzer
            </Link>

            <ThemeSegmentedToggle
              preference={themePreference}
              resolvedTheme={theme}
              onChangePreference={setThemePreference}
            />
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main id="main-content" className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-medium text-purple-300">
            ✦ {content.metadata.pageSubtitle}
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            {content.metadata.pageTitle}
          </h1>
          <p
            className={`mx-auto mt-4 max-w-2xl text-base sm:text-lg leading-relaxed ${
              isDark ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {content.metadata.leadParagraph}
          </p>

          {/* Quick jump anchor navigation */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {content.navigationSections.map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                className={`rounded-full px-4 py-1.5 text-xs font-medium border transition-colors ${
                  isDark
                    ? "border-white/10 bg-white/5 text-gray-300 hover:border-purple-400 hover:text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-purple-500 hover:text-gray-900 shadow-sm"
                }`}
              >
                {sec.title} &darr;
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-16">
          {/* SECTION 1: Public GitHub Data Only */}
          <section
            id="public-data"
            aria-labelledby="public-data-heading"
            className={`rounded-3xl border p-6 sm:p-10 ${
              isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-white shadow-sm"
            }`}
          >
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Data Transparency
              </span>
              <h2
                id="public-data-heading"
                className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl"
              >
                {content.dataRetrieval.heading}
              </h2>
              <p
                className={`mt-2 text-sm sm:text-base leading-relaxed ${
                  isDark ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {content.dataRetrieval.description}
              </p>
            </div>

            {/* Callout box */}
            <div
              className={`mb-8 rounded-2xl border p-4 sm:p-5 flex items-start gap-3 ${
                isDark
                  ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
                  : "border-emerald-200 bg-emerald-50/70 text-emerald-800"
              }`}
            >
              <span className="text-xl shrink-0" aria-hidden="true">
                ✓
              </span>
              <div className="text-sm font-medium">{content.dataRetrieval.callout}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* What We Read */}
              <div
                className={`rounded-2xl border p-5 ${
                  isDark ? "border-emerald-500/20 bg-emerald-950/10" : "border-emerald-100 bg-emerald-50/40"
                }`}
              >
                <h3 className="text-sm font-bold uppercase tracking-wide text-emerald-400 flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  What OpenSourceMate Reads
                </h3>
                <ul className="space-y-4">
                  {content.dataRetrieval.publicDataPoints.map((pt) => (
                    <li key={pt.title} className="text-sm">
                      <div className="font-semibold text-emerald-300">{pt.title}</div>
                      <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        {pt.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What We NEVER Read */}
              <div
                className={`rounded-2xl border p-5 ${
                  isDark ? "border-rose-500/20 bg-rose-950/10" : "border-rose-100 bg-rose-50/40"
                }`}
              >
                <h3 className="text-sm font-bold uppercase tracking-wide text-rose-400 flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  What We Never Access
                </h3>
                <ul className="space-y-4">
                  {content.dataRetrieval.privateDataPoints.map((pt) => (
                    <li key={pt.title} className="text-sm">
                      <div className="font-semibold text-rose-300">{pt.title}</div>
                      <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        {pt.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* SECTION 2: Skill Detection Pipeline */}
          <section
            id="skill-detection"
            aria-labelledby="skill-detection-heading"
            className={`rounded-3xl border p-6 sm:p-10 ${
              isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-white shadow-sm"
            }`}
          >
            <div className="mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Algorithm &amp; Pipeline
              </span>
              <h2
                id="skill-detection-heading"
                className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl"
              >
                {content.skillDetection.heading}
              </h2>
              <p
                className={`mt-2 text-sm sm:text-base leading-relaxed ${
                  isDark ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {content.skillDetection.description}
              </p>
            </div>

            {/* 4 Pipeline Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {content.skillDetection.steps.map((st) => (
                <div
                  key={st.number}
                  className={`rounded-2xl border p-6 transition-all ${
                    isDark
                      ? "border-white/5 bg-white/[0.02] hover:border-white/10"
                      : "border-gray-200 bg-gray-50/80 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold font-mono text-cyan-400">{st.number}</span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isDark ? "bg-white/10 text-gray-300" : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {st.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold mb-2">{st.title}</h3>
                  <p
                    className={`text-xs leading-relaxed mb-3 ${
                      isDark ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {st.summary}
                  </p>
                  <ul className="space-y-1.5 list-disc pl-4 text-xs opacity-85">
                    {st.details.map((dt, idx) => (
                      <li key={idx} className={isDark ? "text-gray-400" : "text-gray-600"}>
                        {dt}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Fork Handling Box (Issue #423) */}
            <div
              className={`mb-8 rounded-2xl border p-5 ${
                isDark
                  ? "border-cyan-500/20 bg-cyan-950/10 text-cyan-200"
                  : "border-cyan-200 bg-cyan-50/70 text-cyan-900"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-xs font-bold text-cyan-300">
                  {content.skillDetection.forkExplanation.badge}
                </span>
                <h4 className="font-bold text-sm">
                  {content.skillDetection.forkExplanation.title}
                </h4>
              </div>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                {content.skillDetection.forkExplanation.description}
              </p>
            </div>

            {/* Proficiency Tiers */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
                Proficiency Levels
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {content.skillDetection.proficiencyTiers.map((tier) => (
                  <div
                    key={tier.name}
                    className={`rounded-xl border p-4 ${
                      isDark ? "border-white/5 bg-white/[0.015]" : "border-gray-200 bg-white shadow-sm"
                    }`}
                  >
                    <div className="font-bold text-sm text-purple-400">{tier.name}</div>
                    <div className="text-xs font-semibold text-gray-400 mt-0.5">{tier.criteria}</div>
                    <p className={`text-xs mt-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                      {tier.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 3: How Issues Are Matched */}
          <section
            id="issue-matching"
            aria-labelledby="issue-matching-heading"
            className={`rounded-3xl border p-6 sm:p-10 ${
              isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-white shadow-sm"
            }`}
          >
            <div className="mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Ranking &amp; Recommendations
              </span>
              <h2
                id="issue-matching-heading"
                className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl"
              >
                {content.issueMatching.heading}
              </h2>
              <p
                className={`mt-2 text-sm sm:text-base leading-relaxed ${
                  isDark ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {content.issueMatching.description}
              </p>
            </div>

            {/* Scoring breakdown cards */}
            <div className="space-y-3 mb-8">
              {content.issueMatching.scoringFactors.map((factor) => (
                <div
                  key={factor.name}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border p-4 ${
                    isDark ? "border-white/5 bg-white/[0.015]" : "border-gray-200 bg-gray-50/70"
                  }`}
                >
                  <div className="sm:max-w-md">
                    <span className="text-sm font-bold text-white">{factor.name}</span>
                    <p className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      {factor.description}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${
                      isDark
                        ? "bg-purple-500/10 text-purple-300 border border-purple-500/20"
                        : "bg-purple-50 text-purple-700 border border-purple-200"
                    }`}
                  >
                    {factor.weight}
                  </span>
                </div>
              ))}
            </div>

            {/* Health Signals (Active / Slow / Inactive / Unknown) */}
            <div className="mb-8">
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
                Maintainer Health Signals &amp; Thresholds
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {content.issueMatching.healthSignals.map((signal) => (
                  <div
                    key={signal.badge}
                    className={`rounded-2xl border p-4 ${
                      isDark ? "border-white/5 bg-white/[0.015]" : "border-gray-200 bg-white shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          signal.badge === "Active"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : signal.badge === "Slow"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : signal.badge === "Inactive"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                        }`}
                      >
                        {signal.badge}
                      </span>
                    </div>
                    <p className="text-xs font-semibold mb-1 text-gray-200">{signal.meaning}</p>
                    <p className={`text-[11px] leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      {signal.thresholds}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bonus matching features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {content.issueMatching.bonusFeatures.map((feat) => (
                <div
                  key={feat.title}
                  className={`rounded-xl border p-4 ${
                    isDark ? "border-white/5 bg-white/[0.015]" : "border-gray-200 bg-white"
                  }`}
                >
                  <h4 className="text-sm font-bold text-emerald-400 mb-1">{feat.title}</h4>
                  <p className={`text-xs leading-relaxed ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                    {feat.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 4: What Is Stored vs. What Is Not */}
          <section
            id="storage-privacy"
            aria-labelledby="storage-privacy-heading"
            className={`rounded-3xl border p-6 sm:p-10 ${
              isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-white shadow-sm"
            }`}
          >
            <div className="mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Privacy Disclosures
              </span>
              <h2
                id="storage-privacy-heading"
                className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl"
              >
                {content.storageAndPrivacy.heading}
              </h2>
              <p
                className={`mt-2 text-sm sm:text-base leading-relaxed ${
                  isDark ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {content.storageAndPrivacy.description}
              </p>
            </div>

            {/* Storage Comparison Table */}
            <div className="overflow-x-auto rounded-2xl border border-white/10 mb-6">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead
                  className={`border-b ${
                    isDark ? "bg-white/[0.04] border-white/10 text-gray-300" : "bg-gray-100 border-gray-200 text-gray-700"
                  }`}
                >
                  <tr>
                    <th className="py-3 px-4 font-semibold">Data Element</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Storage Location</th>
                    <th className="py-3 px-4 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {content.storageAndPrivacy.table.map((row) => (
                    <tr
                      key={row.item}
                      className={`transition-colors ${
                        isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="py-3.5 px-4 font-medium">{row.item}</td>
                      <td className="py-3.5 px-4">
                        {row.stored ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Stored
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-semibold text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            Never
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono opacity-80">{row.location}</td>
                      <td className={`py-3.5 px-4 text-xs leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        {row.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Takeaway */}
            <div
              className={`rounded-2xl border p-4 sm:p-5 flex items-start gap-3 ${
                isDark
                  ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
                  : "border-emerald-200 bg-emerald-50/70 text-emerald-800"
              }`}
            >
              <span className="text-xl shrink-0" aria-hidden="true">
                🛡️
              </span>
              <p className="text-sm font-medium">{content.storageAndPrivacy.takeaway}</p>
            </div>
          </section>

          {/* SECTION 5: Frequently Asked Questions (FAQ) */}
          <section
            id="faq"
            aria-labelledby="faq-heading"
            className={`rounded-3xl border p-6 sm:p-10 ${
              isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-white shadow-sm"
            }`}
          >
            <div className="mb-8 text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Help &amp; Answers
              </span>
              <h2 id="faq-heading" className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                {content.faq.heading}
              </h2>
              <p
                className={`mt-2 text-sm sm:text-base leading-relaxed ${
                  isDark ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {content.faq.description}
              </p>
            </div>

            {/* FAQ Search and Filter Controls */}
            <div className="mb-8 flex flex-col sm:flex-row items-center gap-4">
              {/* Category pills */}
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveFaqCategory(cat)}
                    className={`rounded-full px-3.5 py-1 text-xs font-medium transition ${
                      activeFaqCategory === cat
                        ? "bg-purple-600 text-white shadow-sm"
                        : isDark
                        ? "bg-white/5 text-gray-300 hover:bg-white/10"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    data-testid={`faq-cat-filter-${cat.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Instant Search Bar */}
              <div className="w-full sm:w-auto sm:ml-auto">
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={faqSearchQuery}
                  onChange={(e) => setFaqSearchQuery(e.target.value)}
                  aria-label="Search FAQ questions"
                  className={`w-full sm:w-64 rounded-xl border px-3 py-1.5 text-xs transition focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                    isDark
                      ? "border-white/10 bg-white/5 text-white placeholder-gray-500"
                      : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
                  }`}
                  data-testid="faq-search-input"
                />
              </div>
            </div>

            {/* Accordion List */}
            {filteredFaqItems.length > 0 ? (
              <FAQ theme={theme} items={filteredFaqItems} />
            ) : (
              <div className="text-center py-12 text-sm text-gray-400">
                No matching questions found for &quot;{faqSearchQuery}&quot;.
              </div>
            )}
          </section>
        </div>

        {/* Call to action at bottom */}
        <div className="mt-16 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 transition hover:bg-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            ← Try Profile Analyzer
          </Link>
        </div>
      </main>

      {/* Footer Landmark */}
      <footer
        role="contentinfo"
        className={`border-t px-4 py-8 sm:px-6 mt-16 ${
          isDark ? "border-white/5" : "border-gray-200"
        }`}
      >
        <div
          className={`mx-auto flex max-w-7xl flex-col gap-4 text-xs sm:flex-row sm:items-center sm:justify-between sm:text-sm ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          <p>© {new Date().getFullYear()} OpenSourceMate</p>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <Link
              href="/privacy"
              className="transition hover:text-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded"
            >
              Privacy Policy
            </Link>
            <span>•</span>
            <Link
              href="/compare"
              className="transition hover:text-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded"
            >
              Compare
            </Link>
            <span>•</span>
            <Link
              href="/contribute"
              className="transition hover:text-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded"
            >
              Contribute
            </Link>
            <span>•</span>
            <BuildVersionBadge theme={theme} />
          </div>
          <GitHubLink className="transition hover:text-purple-400">View Repository ↗</GitHubLink>
        </div>
      </footer>
    </div>
  );
}
