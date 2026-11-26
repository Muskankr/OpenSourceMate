import React from "react";
import Link from "next/link";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

export interface HeroProps {
  theme: "dark" | "light";
  onExploreClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ theme, onExploreClick }) => {
  const isDark = theme === "dark";

  return (
    <header className="relative pt-12 pb-16 md:pt-20 md:pb-24 text-center overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-center">
          <Badge variant="emerald" size="md" theme={theme}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            AI-Powered Open-Source Matchmaking
          </Badge>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight">
          Turn your GitHub history into{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            meaningful open-source contributions
          </span>
        </h1>

        <p
          className={`max-w-2xl mx-auto text-base sm:text-lg md:text-xl font-normal leading-relaxed ${
            isDark ? "text-slate-400" : "text-slate-600"
          }`}
        >
          OpenSourceMate analyzes your repositories, extracts technical skills, estimates
          proficiency, and matches you with beginner-friendly issues tailored to your exact
          developer profile.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Button size="lg" variant="primary" theme={theme} onClick={onExploreClick}>
            <span>Analyze Your Profile</span>
            <span aria-hidden="true">&darr;</span>
          </Button>

          <Link href="/compare">
            <Button size="lg" variant="secondary" theme={theme}>
              <span>Compare Developers</span>
              <span aria-hidden="true">&rarr;</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Hero;
