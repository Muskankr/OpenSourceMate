import React from "react";
import Link from "next/link";
import GitHubLink from "./GitHubLink";

export interface FooterProps {
  theme: "dark" | "light";
}

export const Footer: React.FC<FooterProps> = ({ theme }) => {
  const isDark = theme === "dark";

  return (
    <footer
      className={`border-t py-12 transition-colors duration-200 ${
        isDark
          ? "bg-slate-950 border-slate-900 text-slate-400"
          : "bg-slate-50 border-slate-200 text-slate-600"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
            OS
          </div>
          <span className="font-semibold text-slate-200">OpenSourceMate</span>
          <span className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} MIT License
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm">
          <Link href="/compare" className="hover:text-emerald-400 transition-colors">
            Compare Profiles
          </Link>
          <Link href="/contribute" className="hover:text-emerald-400 transition-colors">
            Contribute
          </Link>
          <Link href="/resources" className="hover:text-emerald-400 transition-colors">
            Open Source 101
          </Link>
          <Link href="/privacy" className="hover:text-emerald-400 transition-colors">
            Privacy Policy
          </Link>
          <a
            href="https://github.com/Muskankr/OpenSourceMate/blob/main/CONTRIBUTING.md"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-400 transition-colors"
          >
            Contributing Guide
          </a>
        </div>

        <GitHubLink theme={theme} />
      </div>
    </footer>
  );
};

export default Footer;
