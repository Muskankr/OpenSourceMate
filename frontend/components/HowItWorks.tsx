import React from "react";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";

export interface HowItWorksProps {
  theme: "dark" | "light";
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ theme }) => {
  const isDark = theme === "dark";

  const steps = [
    {
      number: "01",
      badge: "Ingestion",
      title: "Analyze GitHub Repositories",
      description:
        "Fetches public repositories, detects languages, dependencies (package.json, requirements.txt, pyproject.toml), and repository topics.",
      icon: (
        <svg
          className="w-6 h-6 text-emerald-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      ),
    },
    {
      number: "02",
      badge: "Inference",
      title: "Extract & Weight Skills",
      description:
        "Filters noise languages (Dockerfiles, Makefiles, Jupyter), consolidates ecosystems, and calculates recency-based proficiency.",
      icon: (
        <svg
          className="w-6 h-6 text-cyan-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      number: "03",
      badge: "Recommendation",
      title: "Discover Matched Issues",
      description:
        "Scores open issues using TF-IDF term weighting and semantic similarity, surfacing good-first-issues that align with your stack.",
      icon: (
        <svg
          className="w-6 h-6 text-purple-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <Badge variant="purple" theme={theme}>
            Step-by-step
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight">How OpenSourceMate Works</h2>
          <p
            className={`max-w-2xl mx-auto text-sm sm:text-base ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}
          >
            A three-stage intelligent pipeline that bridges your existing coding experience with
            real open-source contribution opportunities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <Card
              key={step.number}
              theme={theme}
              variant="interactive"
              className="relative overflow-hidden group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs font-bold text-slate-500">{step.number}</span>
                <Badge variant="slate" theme={theme}>
                  {step.badge}
                </Badge>
              </div>

              <div className="w-12 h-12 rounded-xl bg-slate-800/60 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {step.icon}
              </div>

              <h3 className="text-lg font-bold mb-2">{step.title}</h3>
              <p
                className={`text-sm leading-relaxed ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                {step.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
