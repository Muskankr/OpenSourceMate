"use client";

import React, { createContext, useContext, useState, useCallback, useId } from "react";
import { usePrefersReducedMotion } from "../utils/usePrefersReducedMotion";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number; // Duration in ms (defaults to 5000ms, 0 means persistent)
}

export interface ToastOptions {
  title?: string;
  duration?: number;
}

export interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (type: ToastType, message: string, options?: ToastOptions) => string;
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export interface ToastProviderProps {
  children: React.ReactNode;
  defaultDuration?: number;
  maxToasts?: number;
  position?: "top-right" | "top-center" | "bottom-right" | "bottom-center";
}

/**
 * ToastProvider (Issue #260)
 *
 * Provides shared notification dispatch and renders queued toasts:
 * - Types: 'success', 'error', 'info'
 * - Accessible: aria-live, role="status" / role="alert", focusable manual close button
 * - Multiple toasts queueing and automatic dismissal
 * - Respects prefers-reduced-motion
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  defaultDuration = 5000,
  maxToasts = 5,
  position = "top-right",
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const prefersReducedMotion = usePrefersReducedMotion();

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, options?: ToastOptions): string => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const duration = options?.duration !== undefined ? options.duration : defaultDuration;

      const newToast: ToastItem = {
        id,
        type,
        title: options?.title,
        message,
        duration,
      };

      setToasts((current) => {
        const next = [...current, newToast];
        return next.length > maxToasts ? next.slice(next.length - maxToasts) : next;
      });

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [defaultDuration, dismissToast, maxToasts]
  );

  const success = useCallback(
    (message: string, options?: ToastOptions) => addToast("success", message, options),
    [addToast]
  );

  const error = useCallback(
    (message: string, options?: ToastOptions) => addToast("error", message, options),
    [addToast]
  );

  const info = useCallback(
    (message: string, options?: ToastOptions) => addToast("info", message, options),
    [addToast]
  );

  // Position classes
  const positionClasses = {
    "top-right": "top-4 right-4 items-end",
    "top-center": "top-4 left-1/2 -translate-x-1/2 items-center",
    "bottom-right": "bottom-4 right-4 items-end",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
  }[position];

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        success,
        error,
        info,
        dismissToast,
        clearToasts,
      }}
    >
      {children}

      {/* Floating Toasts Viewport */}
      <div
        className={`fixed z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full px-4 sm:px-0 ${positionClasses}`}
        aria-label="Notifications"
        tabIndex={-1}
      >
        {toasts.map((toast) => (
          <ToastCard
            key={toast.id}
            toast={toast}
            onDismiss={() => dismissToast(toast.id)}
            prefersReducedMotion={prefersReducedMotion}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export interface ToastCardProps {
  toast: ToastItem;
  onDismiss: () => void;
  prefersReducedMotion: boolean;
}

export const ToastCard: React.FC<ToastCardProps> = ({ toast, onDismiss, prefersReducedMotion }) => {
  const isError = toast.type === "error";
  const isSuccess = toast.type === "success";

  // Dynamic styling based on toast type
  const variantStyles = {
    success: {
      bg: "bg-slate-900/95 border-emerald-500/40 text-emerald-200",
      iconColor: "text-emerald-400",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    error: {
      bg: "bg-slate-900/95 border-rose-500/40 text-rose-200",
      iconColor: "text-rose-400",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      ),
    },
    info: {
      bg: "bg-slate-900/95 border-cyan-500/40 text-cyan-200",
      iconColor: "text-cyan-400",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  }[toast.type];

  const transitionClass = prefersReducedMotion
    ? ""
    : "transition-all duration-200 ease-out transform translate-y-0 opacity-100";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      data-testid={`toast-${toast.type}`}
      data-toast-id={toast.id}
      className={`pointer-events-auto flex items-start gap-3 w-full p-4 rounded-xl border shadow-lg backdrop-blur-md ${variantStyles.bg} ${transitionClass}`}
    >
      <div className={`mt-0.5 ${variantStyles.iconColor}`}>{variantStyles.icon}</div>

      <div className="flex-1 min-w-0">
        {toast.title && <h4 className="text-sm font-semibold mb-0.5">{toast.title}</h4>}
        <p className="text-xs sm:text-sm leading-relaxed text-slate-300 break-words">
          {toast.message}
        </p>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        data-testid="toast-dismiss-button"
        className="shrink-0 -mr-1 -mt-1 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};

/**
 * useToast Hook
 *
 * Hook to trigger toasts anywhere inside a component wrapped with ToastProvider:
 * const toast = useToast();
 * toast.success("Copied to clipboard!");
 * toast.error("Rate limit reached. Please wait a moment.");
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export default ToastProvider;
