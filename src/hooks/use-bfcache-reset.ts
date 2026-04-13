"use client";

import { useEffect, useRef } from "react";

/**
 * Calls `onRestore` when the page is restored from the browser's
 * back-forward cache (bfcache). Useful for resetting loading states
 * that were left pending when `window.location.href` triggered a
 * navigation before React could flush the state update.
 */
export function useBfcacheReset(onRestore: () => void): void {
  const callbackRef = useRef(onRestore);
  callbackRef.current = onRestore;

  useEffect(() => {
    const handler = (e: PageTransitionEvent) => {
      if (e.persisted) callbackRef.current();
    };
    window.addEventListener("pageshow", handler);
    return () => window.removeEventListener("pageshow", handler);
  }, []);
}
