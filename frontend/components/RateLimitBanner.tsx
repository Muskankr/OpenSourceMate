import React from "react";

export interface RateLimitBannerProps {
  message?: string;
  retryAfterSeconds?: number;
  onDismiss?: () => void;
}

export const RateLimitBanner: React.FC<RateLimitBannerProps> = ({
  message = "You have made too many requests. Please wait a minute before trying again.",
  retryAfterSeconds,
  onDismiss,
}) => {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 flex items-start justify-between gap-3 shadow-lg"
    >
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div>
          <h4 className="text-sm font-semibold text-amber-300">Rate Limit Exceeded</h4>
          <p className="text-sm mt-0.5 text-amber-200/90">{message}</p>
          {retryAfterSeconds && retryAfterSeconds > 0 && (
            <p className="text-xs text-amber-300/80 mt-1">
              Estimated reset in: <span className="font-mono font-medium">{retryAfterSeconds}s</span>
            </p>
          )}
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-amber-400/80 hover:text-amber-200 text-xs px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 transition-colors"
          aria-label="Dismiss notice"
        >
          Dismiss
        </button>
      )}
    </div>
  );
};
