"use client";

import React, { useEffect, useRef, useState } from "react";

export interface AutocompleteUser {
  username: string;
  avatar_url?: string;
  profile_url?: string;
}

export interface UsernameAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectUser?: (user: AutocompleteUser) => void;
  debounceMs?: number;
  minChars?: number;
  apiEndpoint?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * UsernameAutocomplete Component
 *
 * Implements accessible combobox with debounce, AbortController cancellation,
 * keyboard arrow key navigation, and fallback to plain input on rate limits.
 */
export default function UsernameAutocomplete({
  value,
  onChange,
  onSelectUser,
  debounceMs = 300,
  minChars = 3,
  apiEndpoint = "/api/v1/github/users/autocomplete",
  placeholder = "Enter GitHub username...",
  className = "",
  disabled = false,
}: UsernameAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AutocompleteUser[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isRateLimited, setIsRateLimited] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions with debounce & abort previous pending requests
  useEffect(() => {
    const query = value.trim();

    if (query.length < minChars || isRateLimited) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsLoading(true);

      try {
        const resp = await fetch(
          `${apiEndpoint}?q=${encodeURIComponent(query)}&limit=5`,
          { signal: controller.signal }
        );

        if (resp.status === 429) {
          setIsRateLimited(true);
          setIsOpen(false);
          return;
        }

        if (resp.ok) {
          const data: AutocompleteUser[] = await resp.json();
          setSuggestions(data);
          setIsOpen(data.length > 0);
          setHighlightedIndex(-1);
        } else {
          setSuggestions([]);
          setIsOpen(false);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setSuggestions([]);
          setIsOpen(false);
        }
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [value, debounceMs, minChars, apiEndpoint, isRateLimited]);

  const handleSelect = (user: AutocompleteUser) => {
    onChange(user.username);
    setIsOpen(false);
    setSuggestions([]);
    if (onSelectUser) {
      onSelectUser(user);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[highlightedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative">
        <input
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="username-autocomplete-list"
          aria-activedescendant={
            highlightedIndex >= 0 ? `suggestion-${highlightedIndex}` : undefined
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
        />

        {isLoading && (
          <div className="absolute right-3.5 top-3.5">
            <svg
              className="animate-spin h-4 w-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Dropdown Suggestions */}
      {isOpen && suggestions.length > 0 && (
        <ul
          id="username-autocomplete-list"
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-1.5 shadow-lg backdrop-blur-md"
        >
          {suggestions.map((user, idx) => {
            const isHighlighted = idx === highlightedIndex;
            return (
              <li
                key={user.username}
                id={`suggestion-${idx}`}
                role="option"
                aria-selected={isHighlighted}
                onClick={() => handleSelect(user)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`flex items-center gap-3 px-3.5 py-2 cursor-pointer transition-colors text-xs ${
                  isHighlighted
                    ? "bg-primary-50 dark:bg-primary-950/70 text-primary-900 dark:text-primary-100 font-medium"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={`${user.username}'s avatar`}
                    className="w-5 h-5 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 inline-flex items-center justify-center text-[10px] text-slate-600 dark:text-slate-300 font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                )}
                <span>@{user.username}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
