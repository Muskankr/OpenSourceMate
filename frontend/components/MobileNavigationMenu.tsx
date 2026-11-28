"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import GitHubLink from "./GitHubLink";
import ThemeToggle from "./ThemeToggle";
import BuildVersionBadge from "./BuildVersionBadge";

export interface MobileNavigationProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  activeSection?: string;
  onNavigateSection?: (sectionId: string) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export interface NavItem {
  label: string;
  href: string;
  isSection?: boolean;
  sectionId?: string;
}

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: "Profile Analyzer", href: "#analyzer", isSection: true, sectionId: "analyzer" },
  { label: "How It Works", href: "#how-it-works", isSection: true, sectionId: "how-it-works" },
  { label: "Compare Profiles", href: "/compare" },
  { label: "Contribute", href: "/contribute" },
  { label: "FAQ", href: "#faq", isSection: true, sectionId: "faq" },
];

/**
 * MobileNavigationMenu Component (Issue #259)
 *
 * Implements accessible disclosure navigation pattern:
 * - Hamburger toggle button below md breakpoint
 * - Opens expandable disclosure panel with full navigation links
 * - Closes on 'Escape' keypress and returns focus to toggle button
 * - Closes on link navigation / click
 * - Keeps ThemeToggle reachable at all times without trapping focus when closed
 * - Fully operable with keyboard and touch down to 320px viewport
 */
export const MobileNavigationMenu: React.FC<MobileNavigationProps> = ({
  theme,
  onToggleTheme,
  activeSection = "analyzer",
  onNavigateSection,
  isOpen: controlledIsOpen,
  onOpenChange,
  className = "",
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isDark = theme === "dark";

  const setOpen = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalIsOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  // Close on Escape and return focus to toggle button
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        // Return focus to the trigger button
        toggleButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Close when window is resized above mobile breakpoint (768px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isOpen) {
        setOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  const handleLinkClick = (item: NavItem, e: React.MouseEvent) => {
    if (item.isSection && item.sectionId) {
      e.preventDefault();
      onNavigateSection?.(item.sectionId);
    }
    setOpen(false);
    toggleButtonRef.current?.focus();
  };

  return (
    <div className={`relative md:hidden ${className}`} data-testid="mobile-navigation-container">
      {/* Controls Container: Theme toggle remains reachable outside menu */}
      <div className="flex items-center gap-2">
        <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />

        <button
          ref={toggleButtonRef}
          type="button"
          onClick={() => setOpen(!isOpen)}
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isOpen}
          aria-controls="mobile-navigation-panel"
          data-testid="mobile-menu-toggle-button"
          className={`p-2 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
            isDark
              ? "border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800"
              : "border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            {isOpen ? (
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

      {/* Expandable Disclosure Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          id="mobile-navigation-panel"
          role="region"
          aria-label="Mobile Navigation Menu"
          data-testid="mobile-navigation-panel"
          className={`absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border p-4 shadow-xl backdrop-blur-xl z-50 transition-all ${
            isDark
              ? "bg-slate-950/95 border-slate-800 text-slate-200 shadow-emerald-950/20"
              : "bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/40"
          }`}
        >
          <div className="flex flex-col space-y-1">
            {DEFAULT_NAV_ITEMS.map((item) => {
              const isActive = item.sectionId && activeSection === item.sectionId;
              const linkClasses = `block px-3 py-2.5 rounded-xl text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                isActive
                  ? isDark
                    ? "bg-emerald-500/10 text-emerald-400 font-semibold"
                    : "bg-emerald-50 text-emerald-600 font-semibold"
                  : isDark
                    ? "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`;

              if (item.isSection) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={(e) => handleLinkClick(item, e)}
                    className={linkClasses}
                    aria-current={isActive ? "location" : undefined}
                    data-testid={`mobile-nav-${item.sectionId}`}
                  >
                    {item.label}
                  </a>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleLinkClick(item, e)}
                  className={linkClasses}
                  data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {item.label}
                </Link>
              );
            })}

            <div
              className={`pt-2 mt-2 border-t flex items-center justify-between px-3 ${
                isDark ? "border-slate-800" : "border-slate-200"
              }`}
            >
              <span className="text-xs text-slate-400">Repository</span>
              <GitHubLink theme={theme} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileNavigationMenu;
