import type { GitHubUserProfile, UserSkillsResponse } from "../types/api";
import type { ServiceErrorDetails } from "./errorHandling";

export interface AnalyzerData {
  profile: GitHubUserProfile;
  skills: UserSkillsResponse;
}

export type AnalyzerState =
  | { status: "idle" }
  | { status: "loading"; requestId: number; username: string; data?: AnalyzerData }
  | { status: "success"; requestId: number; username: string; data: AnalyzerData }
  | {
      status: "error";
      requestId: number;
      username: string;
      message: string;
      canRetry: boolean;
      serviceError?: ServiceErrorDetails;
      data?: AnalyzerData;
    }
  | {
      status: "rate-limited";
      requestId: number;
      username: string;
      message: string;
      resetAt?: string;
      canRetry: boolean;
      data?: AnalyzerData;
    };

export type AnalyzerAction =
  | { type: "submit"; requestId: number; username: string; data?: AnalyzerData }
  | { type: "success"; requestId: number; data: AnalyzerData }
  | {
      type: "error";
      requestId: number;
      message: string;
      canRetry: boolean;
      serviceError?: ServiceErrorDetails;
    }
  | {
      type: "rate-limited";
      requestId: number;
      message: string;
      resetAt?: string;
      canRetry: boolean;
    }
  | { type: "validation-error"; message: string }
  | { type: "clear-service-error" }
  | { type: "clear-error" }
  | { type: "reset" };

export const initialAnalyzerState: AnalyzerState = { status: "idle" };

function currentData(state: AnalyzerState): AnalyzerData | undefined {
  return state.status === "idle" ? undefined : state.data;
}

export function analyzerReducer(state: AnalyzerState, action: AnalyzerAction): AnalyzerState {
  switch (action.type) {
    case "submit":
      if (state.status === "loading") return state;
      return {
        status: "loading",
        requestId: action.requestId,
        username: action.username,
        ...(action.data ? { data: action.data } : {}),
      };
    case "success":
      if (state.status === "idle" || state.requestId !== action.requestId) return state;
      return {
        status: "success",
        requestId: action.requestId,
        username: state.username,
        data: action.data,
      };
    case "error":
      if (state.status === "idle" || state.requestId !== action.requestId) return state;
      return {
        status: "error",
        requestId: action.requestId,
        username: state.username,
        message: action.message,
        canRetry: action.canRetry,
        ...(action.serviceError ? { serviceError: action.serviceError } : {}),
        ...(currentData(state) ? { data: currentData(state) } : {}),
      };
    case "rate-limited":
      if (state.status === "idle" || state.requestId !== action.requestId) return state;
      return {
        status: "rate-limited",
        requestId: action.requestId,
        username: state.username,
        message: action.message,
        ...(action.resetAt ? { resetAt: action.resetAt } : {}),
        canRetry: action.canRetry,
        ...(currentData(state) ? { data: currentData(state) } : {}),
      };
    case "validation-error":
      return {
        status: "error",
        requestId: state.status === "idle" ? 0 : state.requestId,
        username: state.status === "idle" ? "" : state.username,
        message: action.message,
        canRetry: false,
        ...(currentData(state) ? { data: currentData(state) } : {}),
      };
    case "clear-service-error":
      if (state.status !== "error" || !state.serviceError) return state;
      return {
        status: "error",
        requestId: state.requestId,
        username: state.username,
        message: state.message,
        canRetry: state.canRetry,
        ...(state.data ? { data: state.data } : {}),
      };
    case "clear-error":
      if (state.status !== "error" && state.status !== "rate-limited") return state;
      if (!state.data) return { status: "idle" };
      return {
        status: "success",
        requestId: state.requestId,
        username: state.username,
        data: state.data,
      };
    case "reset":
      return initialAnalyzerState;
  }
}
