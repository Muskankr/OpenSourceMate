"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import enMessages from "../messages/en.json";
import hiMessages from "../messages/hi.json";

export type Locale = "en" | "hi";

export type Messages = typeof enMessages;

export interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: Messages;
  t: (
    path: string,
    fallbackOrParams?: string | Record<string, string | number>,
    params?: Record<string, string | number>
  ) => string;
}

const messageRegistry: Record<Locale, any> = {
  en: enMessages,
  hi: hiMessages,
};

const I18nContext = createContext<I18nContextType | null>(null);

/**
 * Safely resolves a nested dot-delimited key in a dictionary.
 */
function resolveKey(dict: any, path: string): string | null {
  if (!dict || typeof dict !== "object") return null;
  const keys = path.split(".");
  let current: any = dict;
  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = current[key];
    } else {
      return null;
    }
  }
  return typeof current === "string" ? current : null;
}

/**
 * Interpolates parameters like {name} or {{name}} in a translated template string.
 */
function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}|\{\{(\w+)\}\}/g, (_, k1, k2) => {
    const key = k1 || k2;
    return key in params ? String(params[key]) : `{${key}}`;
  });
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("preferred_locale") as Locale;
      if (saved && (saved === "en" || saved === "hi")) {
        setLocaleState(saved);
        if (typeof document !== "undefined") {
          document.documentElement.lang = saved;
        }
      }
    } catch {
      // Fallback in environments with restricted storage
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem("preferred_locale", newLocale);
      if (typeof document !== "undefined") {
        document.documentElement.lang = newLocale;
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  };

  const messages = messageRegistry[locale] || messageRegistry.en;

  const t = (
    path: string,
    fallbackOrParams?: string | Record<string, string | number>,
    params?: Record<string, string | number>
  ): string => {
    let fallback = "";
    let actualParams = params;

    if (typeof fallbackOrParams === "object" && fallbackOrParams !== null) {
      actualParams = fallbackOrParams;
    } else if (typeof fallbackOrParams === "string") {
      fallback = fallbackOrParams;
    }

    // 1. Try to resolve in the active locale dictionary
    const localized = resolveKey(messages, path);
    if (localized !== null) {
      return interpolate(localized, actualParams);
    }

    // 2. Fall back to English dictionary (Acceptance Criteria: Missing keys fall back to English)
    if (locale !== "en") {
      const enValue = resolveKey(messageRegistry.en, path);
      if (enValue !== null) {
        return interpolate(enValue, actualParams);
      }
    }

    // 3. Fall back to explicit fallback string or the lookup path
    return interpolate(fallback || path, actualParams);
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, messages, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      locale: "en" as Locale,
      setLocale: () => {},
      messages: enMessages,
      t: (
        path: string,
        fallbackOrParams?: string | Record<string, string | number>,
        params?: Record<string, string | number>
      ) => {
        let fallback = "";
        let actualParams = params;
        if (typeof fallbackOrParams === "object" && fallbackOrParams !== null) {
          actualParams = fallbackOrParams;
        } else if (typeof fallbackOrParams === "string") {
          fallback = fallbackOrParams;
        }
        const val = resolveKey(enMessages, path);
        return interpolate(val !== null ? val : fallback || path, actualParams);
      },
    };
  }
  return context;
}
