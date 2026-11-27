"use client";

import { useEffect } from "react";

/**
 * Client component to register the PWA Service Worker for offline caching and installability.
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV === "test"
    ) {
      return;
    }

    const registerWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        // Check for service worker updates upon deployment
        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener("statechange", () => {
              if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New deployment available; skip waiting and take control
                installingWorker.postMessage({ type: "SKIP_WAITING" });
              }
            });
          }
        });
      } catch (error) {
        // Suppress non-blocking registration issues in non-HTTPS / development environments
        console.debug("[SW] Registration skipped or failed:", error);
      }
    };

    if (document.readyState === "complete") {
      registerWorker();
    } else {
      window.addEventListener("load", registerWorker);
      return () => window.removeEventListener("load", registerWorker);
    }
  }, []);

  return null;
}
