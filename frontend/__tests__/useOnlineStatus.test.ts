import { renderHook, act } from "@testing-library/react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

describe("useOnlineStatus Hook (hooks/useOnlineStatus.ts)", () => {
  const originalOnLine = navigator.onLine;

  afterEach(() => {
    Object.defineProperty(navigator, "onLine", {
      value: originalOnLine,
      configurable: true,
    });
  });

  it("initializes with true when navigator.onLine is true", () => {
    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(false);
  });

  it("initializes with false when navigator.onLine is false", () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
    });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current.isOnline).toBe(false);
  });

  it("updates state when offline and online window events fire", () => {
    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current.isOnline).toBe(true);

    // Simulate going offline
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.wasOffline).toBe(true);

    // Simulate coming back online
    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(true);
  });
});
