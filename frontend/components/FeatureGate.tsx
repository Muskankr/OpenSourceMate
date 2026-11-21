"use client";

import React, { ReactNode } from "react";
import { isFeatureEnabled, type FeatureFlags } from "../utils/featureFlags";

export interface FeatureGateProps {
  /** The feature flag name to evaluate */
  flag: keyof FeatureFlags;
  /** Component or content to display when flag is enabled */
  children: ReactNode;
  /** Optional fallback UI when feature is disabled (e.g., Coming Soon badge or placeholder) */
  fallback?: ReactNode;
}

/**
 * FeatureGate conditionally renders children only if the specified feature flag is enabled.
 */
export function FeatureGate({ flag, children, fallback = null }: FeatureGateProps) {
  const enabled = isFeatureEnabled(flag);

  if (enabled) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

export interface ComingSoonPlaceholderProps {
  featureName: string;
  description?: string;
  className?: string;
}

/**
 * Accessible placeholder component rendered when an unreleased feature is disabled.
 */
export function ComingSoonPlaceholder({
  featureName,
  description,
  className = "",
}: ComingSoonPlaceholderProps) {
  return (
    <div
      role="status"
      aria-label={`${featureName} feature coming soon`}
      className={`rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 p-6 text-center ${className}`}
    >
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 dark:bg-primary-950/70 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
        Feature Coming Soon
      </div>
      <h4 className="text-base font-medium text-slate-800 dark:text-slate-200">
        {featureName}
      </h4>
      {description && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          {description}
        </p>
      )}
    </div>
  );
}

export default FeatureGate;
