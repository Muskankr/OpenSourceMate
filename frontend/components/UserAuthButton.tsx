"use client";

import React, { useEffect, useState } from "react";
import { fetchAuthStatus, logoutUser, getApiBaseUrl } from "../utils/apiClient";
import type { AuthUserStatus } from "../types/api";

interface UserAuthButtonProps {
  theme?: "dark" | "light";
  className?: string;
  onAuthChange?: (status: AuthUserStatus) => void;
}

export default function UserAuthButton({
  theme = "dark",
  className = "",
  onAuthChange,
}: UserAuthButtonProps) {
  const [authStatus, setAuthStatus] = useState<AuthUserStatus>({
    authenticated: false,
    using_visitor_token: false,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const status = await fetchAuthStatus();
        if (mounted) {
          setAuthStatus(status);
          onAuthChange?.(status);
        }
      } catch {
        if (mounted) {
          setAuthStatus({ authenticated: false, using_visitor_token: false });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [onAuthChange]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutUser();
      const updated: AuthUserStatus = { authenticated: false, using_visitor_token: false };
      setAuthStatus(updated);
      onAuthChange?.(updated);
    } catch (err) {
      console.error("Failed to sign out:", err);
    } finally {
      setLoggingOut(false);
    }
  };

  const isDark = theme === "dark";
  const loginUrl = `${getApiBaseUrl()}/api/auth/login`;

  if (loading) {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs opacity-60 ${className}`}
        aria-hidden="true"
      >
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
        <span>Checking auth...</span>
      </div>
    );
  }

  if (authStatus.authenticated) {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-xl border p-1 text-xs font-medium transition-colors ${
          isDark
            ? "border-white/10 bg-white/5 text-gray-200"
            : "border-gray-200 bg-gray-50 text-gray-800"
        } ${className}`}
      >
        {authStatus.avatar_url ? (
          <img
            src={authStatus.avatar_url}
            alt={authStatus.username || "User avatar"}
            className="h-6 w-6 rounded-lg object-cover border border-purple-500/30"
          />
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-600 text-[10px] font-bold text-white">
            {authStatus.username ? authStatus.username[0].toUpperCase() : "U"}
          </span>
        )}

        <div className="flex flex-col text-left leading-none pr-1">
          <span className="font-semibold text-xs truncate max-w-[100px]" title={authStatus.username}>
            @{authStatus.username}
          </span>
          <span
            className="text-[10px] text-emerald-400 font-normal"
            title="Using your GitHub account rate limit"
          >
            Personal Limit Active
          </span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          aria-label="Sign out from GitHub session"
          className="rounded-lg bg-red-500/10 px-2 py-1 text-[11px] font-medium text-red-400 transition hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50"
        >
          {loggingOut ? "..." : "Sign out"}
        </button>
      </div>
    );
  }

  return (
    <a
      href={loginUrl}
      title="Sign in with GitHub to use your own GitHub rate limit (read-only public access)"
      aria-label="Sign in with GitHub (read-only)"
      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
        isDark
          ? "border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
          : "border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100"
      } ${className}`}
    >
      <svg
        className="h-4 w-4 fill-current"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        />
      </svg>
      <span>Sign in</span>
    </a>
  );
}
