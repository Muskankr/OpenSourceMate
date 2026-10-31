/**
 * Error classification, sanitization, and reporting utilities for OpenSourceMate.
 * Ensures friendly user-facing messages, suppresses raw stack traces,
 * and detects service unavailability / network failures (Issue #128).
 */

import { ApiClientError, isAbortError } from "./apiClient";

export interface ServiceErrorDetails {
  isServiceUnavailable: boolean;
  title: string;
  message: string;
  statusCode?: number;
  errorCode?: string;
  canRetry: boolean;
  reportUrl: string;
}

/**
 * Default GitHub new issue repository URL.
 */
export const GITHUB_ISSUES_URL = "https://github.com/Muskankr/OpenSourceMate/issues/new";

/**
 * Determines whether an error is due to network connectivity failure,
 * connection refused, or a 5xx server-side failure.
 */
export function isNetworkOrServerError(error: unknown): boolean {
  if (!error || isAbortError(error)) {
    return false;
  }

  // ApiClientError with 5xx or status 0 (network failure)
  if (error instanceof ApiClientError) {
    if (error.status === 0 || error.code === "NETWORK_ERROR") {
      return true;
    }
    if (error.status >= 500 && error.status <= 599) {
      return true;
    }
  }

  // HTTP status numbers directly
  if (typeof error === "number") {
    return (error >= 500 && error <= 599) || error === 0;
  }

  // Native Fetch TypeError ("Failed to fetch", "fetch failed", "Network request failed")
  if (error instanceof TypeError) {
    return true;
  }

  // Custom object with status
  if (typeof error === "object" && error !== null) {
    const errObj = error as Record<string, unknown>;
    const status = Number(errObj.status || errObj.statusCode);
    if (!isNaN(status) && status >= 500 && status <= 599) {
      return true;
    }
    if (status === 0 || errObj.code === "ECONNREFUSED" || errObj.code === "ENOTFOUND") {
      return true;
    }

    const message = String(errObj.message || "").toLowerCase();
    if (
      message.includes("failed to fetch") ||
      message.includes("network error") ||
      message.includes("econnrefused") ||
      message.includes("connection refused") ||
      message.includes("load failed")
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Sanitizes any error to ensure raw stack traces, internal paths,
 * or raw technical jargon are NEVER displayed to end-users.
 */
export function sanitizeErrorMessage(error: unknown, fallback?: string): string {
  if (!error) {
    return fallback || "An unexpected error occurred. Please try again.";
  }

  let raw = "";
  if (typeof error === "string") {
    raw = error;
  } else if (error instanceof Error) {
    raw = error.message;
  } else if (typeof error === "object" && error !== null) {
    const errObj = error as Record<string, unknown>;
    raw = String(errObj.message || errObj.detail || "");
  }

  // If message contains traceback or stack trace indicators, replace completely
  if (
    raw.includes("Traceback (most recent call last)") ||
    raw.includes("at ") ||
    raw.includes("Error:") ||
    raw.includes(".py:") ||
    raw.includes(".ts:") ||
    raw.includes("node_modules") ||
    raw.includes("ECONNREFUSED") ||
    raw.includes("127.0.0.1") ||
    raw.includes("localhost:")
  ) {
    return "The backend service is currently unreachable. Please ensure the backend server is running and try again.";
  }

  // Strip file system paths if any exist
  const sanitized = raw.replace(/(?:[a-zA-Z]:|\/)[^\s]+/g, "").trim();

  return sanitized || fallback || "An unexpected error occurred. Please try again.";
}

/**
 * Builds a pre-filled GitHub issue report URL allowing users to easily report
 * service availability problems without exposing private tokens or credentials.
 */
export function getReportIssueUrl(context?: {
  endpoint?: string;
  statusCode?: number;
  username?: string;
}): string {
  const title = encodeURIComponent(
    context?.statusCode
      ? `[Bug]: Service Unavailable (HTTP ${context.statusCode})`
      : "[Bug]: Backend Service Unavailable / Cannot connect"
  );

  const timestamp = new Date().toISOString();
  const body = encodeURIComponent(
    `### Description\n` +
      `The OpenSourceMate frontend was unable to communicate with the backend API.\n\n` +
      `### Details\n` +
      `- **Timestamp**: ${timestamp}\n` +
      `- **Status Code**: ${context?.statusCode ?? "Network / Unreachable"}\n` +
      (context?.endpoint ? `- **Endpoint**: \`${context.endpoint}\`\n` : "") +
      `\n### Steps to Reproduce\n` +
      `1. Open the OpenSourceMate dashboard.\n` +
      `2. Analyze profile.\n` +
      `3. Observe service unavailable alert.\n`
  );

  return `${GITHUB_ISSUES_URL}?title=${title}&labels=bug&body=${body}`;
}

/**
 * Extracts structured service error details suitable for rendering
 * the friendly ServiceUnavailableBanner.
 */
export function resolveServiceErrorDetails(
  error: unknown,
  context?: { username?: string; endpoint?: string }
): ServiceErrorDetails {
  const isServiceDown = isNetworkOrServerError(error);
  let statusCode: number | undefined;
  let errorCode: string | undefined;

  if (error instanceof ApiClientError) {
    statusCode = error.status;
    errorCode = error.code;
  } else if (typeof error === "number") {
    statusCode = error;
  }

  let title = "Service Temporarily Unavailable";
  let message =
    "We are having trouble connecting to the OpenSourceMate backend server. The service might be starting up or temporarily offline.";

  if (statusCode === 502 || statusCode === 503 || statusCode === 504) {
    title = "Service Temporarily Unavailable";
    message =
      "The backend service is temporarily unavailable or undergoing maintenance. Please try again in a few moments.";
  } else if (statusCode === 500) {
    title = "Backend Service Error";
    message =
      "An unexpected server error occurred while processing your request. Please try again shortly.";
  } else if (statusCode === 0 || error instanceof TypeError || errorCode === "NETWORK_ERROR") {
    title = "Unable to Connect to Server";
    message =
      "Unable to establish a connection to the OpenSourceMate backend. Please check your internet connection and verify that the backend service is running.";
  }

  return {
    isServiceUnavailable: isServiceDown,
    title,
    message,
    statusCode,
    errorCode,
    canRetry: true,
    reportUrl: getReportIssueUrl({
      statusCode,
      endpoint: context?.endpoint,
      username: context?.username,
    }),
  };
}

