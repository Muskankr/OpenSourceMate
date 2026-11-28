"use client";

import React from "react";
import { useI18n, type Locale } from "../utils/i18n";

export interface LanguageSwitcherProps {
  theme?: "dark" | "light";
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  theme = "dark",
  className = "",
}) => {
  const { locale, setLocale, t } = useI18n();
  const isDark = theme === "dark";

  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
      <label htmlFor="language-select" className="sr-only">
        {t("common.language.select", "Language")}
      </label>
      <svg
        className={`w-4 h-4 pointer-events-none flex-shrink-0 ${isDark ? "text-slate-400" : "text-slate-600"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
        />
      </svg>
      <select
        id="language-select"
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        aria-label={t("common.language.select", "Language")}
        className={`appearance-none text-xs font-semibold rounded-lg pl-2 pr-6 py-1.5 border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400 ${
          isDark
            ? "bg-[#05070d]/90 border-white/10 text-slate-300 hover:border-white/20"
            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 shadow-sm"
        }`}
      >
        <option value="en">English</option>
        <option value="hi">हिन्दी</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;
