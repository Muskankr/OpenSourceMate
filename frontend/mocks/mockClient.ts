import { handleMockApiRequest, type MockResponse } from "./handlers";

let isMockingActive = false;
let originalFetch: typeof fetch | null = null;

/**
 * Checks whether mock API mode is requested via environment variable.
 */
export function isMockApiEnabled(): boolean {
  if (typeof process !== "undefined" && process.env) {
    if (process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
      return true;
    }
    if (process.env.USE_MOCKS === "true") {
      return true;
    }
  }
  return isMockingActive;
}

/**
 * Enables mock API interception in-process (used for testing and dev).
 */
export function enableMockApi(latencyMs = 20): void {
  if (isMockingActive) return;
  isMockingActive = true;

  if (typeof window !== "undefined") {
    originalFetch = window.fetch;
    window.fetch = createMockFetch(originalFetch, latencyMs);
  } else if (typeof global !== "undefined" && global.fetch) {
    originalFetch = global.fetch;
    global.fetch = createMockFetch(originalFetch, latencyMs);
  }
}

/**
 * Disables mock API interception and restores the original fetch implementation.
 */
export function disableMockApi(): void {
  if (!isMockingActive) return;
  isMockingActive = false;

  if (typeof window !== "undefined" && originalFetch) {
    window.fetch = originalFetch;
    originalFetch = null;
  } else if (typeof global !== "undefined" && originalFetch) {
    global.fetch = originalFetch;
    originalFetch = null;
  }
}

/**
 * Higher-order fetch function that intercepts matching mock routes.
 */
function createMockFetch(nativeFetch: typeof fetch, latencyMs: number): typeof fetch {
  return async function mockFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const method = init?.method || "GET";

    const mockRes: MockResponse | null = handleMockApiRequest(url, method);

    if (mockRes) {
      if (latencyMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, latencyMs));
      }

      const headers = new Headers(mockRes.headers);
      return new Response(JSON.stringify(mockRes.body), {
        status: mockRes.status,
        headers,
      });
    }

    // Pass through to native fetch if no mock handler intercepted
    return nativeFetch(input, init);
  };
}

// Automatically initialize if NEXT_PUBLIC_USE_MOCKS is set
if (isMockApiEnabled() && typeof window !== "undefined") {
  enableMockApi();
}
