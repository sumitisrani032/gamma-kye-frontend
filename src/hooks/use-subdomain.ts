"use client";

import { useMemo } from "react";
import { getSubdomain } from "@/lib/tenant";

export function useSubdomain(): string | null {
  return useMemo(() => {
    if (typeof window === "undefined") return null;
    return getSubdomain(window.location.hostname);
  }, []);
}
