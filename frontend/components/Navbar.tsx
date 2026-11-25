import React, { useRef, useEffect } from "react";
import Link from "next/link";
import GitHubLink from "./GitHubLink";
import ThemeToggle, { ThemeSegmentedToggle } from "./ThemeToggle";
import BuildVersionBadge from "./BuildVersionBadge";
import type { ThemePreference } from "../utils/theme";

export interface NavbarProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  themePreference?: ThemePreference;
  onChangePreference?: (preference: ThemePreference) => void;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onNavigateSection?: (sectionId: string) => void;
  activeSection?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme,
  onToggleTheme,
  themePreference,
  onChangePreference,
  mobileMenuOpen,
  onToggleMobileMenu,
  onNavigateSection,
  activeSection,
}) => {
  const isDark = theme === "dark";
  const mobileButtonRef = useRef<HTMLButtonElement>(null);

  // Close mobile menu on Escape key and return focus to mobile menu button
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onToggleMobileMenu();
        mobileButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen, onToggleMobileMenu]);

  const handleMobileNavClick = (sectionId?: string) => {
    if (sectionId) {
      onNavigateSection?.(sectionId);
    }
    if (mobileMenuOpen) {
      onToggleMobileMenu();
    }
    mobileButtonRef.current?.focus();
  };

  return (
    <nav
      className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-200 ${
        isDark ? "bg-slate-950/80 border-slate-800" : "bg-white/80 border-slate-200"
      }`}
      aria-label="Main Navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 group font-bold text-lg tracking-tight"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                OS
              </div>
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                OpenSourceMate
              </span>
            </Link>
            <BuildVersionBadge />
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a
              href="#analyzer"
              onClick={(e) => {
                e.preventDefault();
                onNavigateSection?.("analyzer");
              }}
              className={`transition-colors ${
                activeSection === "analyzer"
                  ? isDark
                    ? "text-emerald-400"
                    : "text-emerald-600"
                  : isDark
                    ? "text-slate-400 hover:text-slate-200"
                    : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Profile Analyzer
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                onNavigateSection?.("how-it-works");
              }}
              className={`transition-colors ${
                activeSection === "how-it-works"
                  ? isDark
                    ? "text-emerald-400"
                    : "text-emerald-600"
                  : isDark
                    ? "text-slate-400 hover:text-slate-200"
                    : "text-slate-600 hover:text-slate-900"
              }`}
            >
              How It Works
            </a>
            <Link
              href="/discover"
              className={`transition-colors ${
                isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Discover
            </Link>
            <Link
              href="/compare"
              className={`transition-colors ${
                isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Compare
            </Link>
            <Link
              href="/contribute"
              className={`transition-colors ${
                isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Contribute
            </Link>
            <a
              href="#faq"
              onClick={(e) => {
                e.preventDefault();
                onNavigateSection?.("faq");
              }}
              className={`transition-colors ${
                activeSection === "faq"
                  ? isDark
                    ? "text-emerald-400"
                    : "text-emerald-600"
                  : isDark
                    ? "text-slate-400 hover:text-slate-200"
                    : "text-slate-600 hover:text-slate-900"
              }`}
            >
              FAQ
            </a>
          </div>

          {/* Right actions: Theme toggle and GitHub Link */}
          <div className="flex items-center gap-3">
            {onChangePreference ? (
              <ThemeSegmentedToggle
                preference={themePreference}
                resolvedTheme={theme}
                onChangePreference={onChangePreference}
              />
            ) : (
              <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
            )}

            <GitHubLink theme={theme} />

            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <button
                ref={mobileButtonRef}
                type="button"
                onClick={onToggleMobileMenu}
                aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-navigation-dropdown"
                id="mobile-menu-trigger"
                data-testid="mobile-nav-toggle-btn"
                className={`p-2 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                  isDark
                    ? "border-slate-800 text-slate-400 hover:text-slate-200"
                    : "border-slate-200 text-slate-600 hover:text-slate-900"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  {mobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-dropdown"
          role="region"
          aria-label="Mobile Navigation Menu"
          data-testid="mobile-navigation-dropdown"
          className={`md:hidden border-b px-4 pt-2 pb-4 space-y-2 ${
            isDark
              ? "bg-slate-950 border-slate-800 text-slate-300"
              : "bg-white border-slate-200 text-slate-700"
          }`}
        >
          <a
            href="#analyzer"
            onClick={(e) => {
              e.preventDefault();
              handleMobileNavClick("analyzer");
            }}
            className="block py-2 text-sm font-medium hover:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded-lg px-2"
          >
            Profile Analyzer
          </a>
          <a
            href="#how-it-works"
            onClick={(e) => {
              e.preventDefault();
              handleMobileNavClick("how-it-works");
            }}
            className="block py-2 text-sm font-medium hover:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded-lg px-2"
          >
            How It Works
          </a>
          <Link
            href="/compare"
            onClick={() => handleMobileNavClick()}
            className="block py-2 text-sm font-medium hover:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded-lg px-2"
          >
            Compare Profiles
          </Link>
          <Link
            href="/contribute"
            onClick={() => handleMobileNavClick()}
            className="block py-2 text-sm font-medium hover:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded-lg px-2"
          >
            Contribute
          </Link>
          <a
            href="#faq"
            onClick={(e) => {
              e.preventDefault();
              handleMobileNavClick("faq");
            }}
            className="block py-2 text-sm font-medium hover:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded-lg px-2"
          >
            FAQ
          </a>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Theme</span>
            {onChangePreference ? (
              <ThemeSegmentedToggle
                preference={themePreference}
                resolvedTheme={theme}
                onChangePreference={onChangePreference}
              />
            ) : (
              <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
