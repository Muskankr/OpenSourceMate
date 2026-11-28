"use client";

import { useEffect, useState } from "react";

/**
 * Custom React hook that detects if the user has requested the system
 * to minimize the amount of animation or movement it uses via `prefers-reduced-motion`.
 *
 * Adheres to WCAG 2.2 Success Criterion 2.3.3 (Animation from Interactions).
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const mediaQueryList = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQueryList.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    if (typeof mediaQueryList.addEventListener === "function") {
      mediaQueryList.addEventListener("change", listener);
    } else if (
      typeof (mediaQueryList as unknown as { addListener: (l: unknown) => void }).addListener ===
      "function"
    ) {
      (mediaQueryList as unknown as { addListener: (l: unknown) => void }).addListener(listener);
    }

    return () => {
      if (typeof mediaQueryList.removeEventListener === "function") {
        mediaQueryList.removeEventListener("change", listener);
      } else if (
        typeof (mediaQueryList as unknown as { removeListener: (l: unknown) => void })
          .removeListener === "function"
      ) {
        (mediaQueryList as unknown as { removeListener: (l: unknown) => void }).removeListener(
          listener
        );
      }
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Helper utility returning appropriate Tailwind transition class based on motion preference.
 */
export function getMotionSafeClass(
  standardClass: string,
  customReduced?: string
): string {
  if (customReduced) {
    return `${standardClass} motion-reduce:${customReduced}`;
  }
  return `${standardClass} motion-reduce:transition-none motion-reduce:transform-none motion-reduce:animate-none`;
}
