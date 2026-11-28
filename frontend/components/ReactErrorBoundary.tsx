"use client";

import React from "react";
import { buildErrorDiagnostics } from "../utils/errorDiagnostics";

export interface ReactErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

interface ReactErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  copied: boolean;
}

export default class ReactErrorBoundary extends React.Component<
  ReactErrorBoundaryProps,
  ReactErrorBoundaryState
> {
  constructor(props: ReactErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ReactErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (process.env.NODE_ENV === "development") {
      console.error("ReactErrorBoundary caught an error:", error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, copied: false });
    this.props.onReset?.();
  };

  handleCopyDiagnostics = async (): Promise<void> => {
    if (!this.state.error) return;
    const diagnostics = buildErrorDiagnostics(this.state.error);
    try {
      await navigator.clipboard.writeText(diagnostics);
      this.setState({ copied: true });
      setTimeout(() => {
        this.setState((prev) => (prev.copied ? { ...prev, copied: false } : prev));
      }, 2000);
    } catch {
      // Clipboard API unavailable
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        role="alert"
        data-testid="react-error-boundary-fallback"
        className="mx-auto my-8 max-w-lg rounded-2xl border border-red-500/30 bg-slate-900 p-6 text-center text-white shadow-xl"
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-xl">
          ⚠️
        </div>
        <h2 className="text-lg font-bold">Something went wrong</h2>
        <p className="mt-2 text-xs text-gray-300 sm:text-sm">
          An unexpected rendering error occurred. You can try again or copy diagnostics to help
          maintainers investigate.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={this.handleReset}
            data-testid="error-boundary-try-again"
            className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={this.handleCopyDiagnostics}
            data-testid="error-boundary-copy-diagnostics"
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-200 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            {this.state.copied ? "Diagnostics copied!" : "Copy diagnostics"}
          </button>
        </div>
      </div>
    );
  }
}
