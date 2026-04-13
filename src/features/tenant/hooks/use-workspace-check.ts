"use client";

import { useState, useCallback } from "react";
import { checkTenant } from "@/services/tenant-service";
import { navigateToTenant } from "@/lib/tenant";
import { useBfcacheReset } from "@/hooks/use-bfcache-reset";

export type WorkspaceError = "suspended" | "not_found" | string;

interface UseWorkspaceCheckReturn {
  subdomain: string;
  setSubdomain: (value: string) => void;
  normalized: string;
  error: WorkspaceError;
  loading: boolean;
  clearError: () => void;
  handleCheck: () => Promise<void>;
}

export function useWorkspaceCheck(redirectPath = "/login"): UseWorkspaceCheckReturn {
  const [subdomain, setSubdomain] = useState("");
  const [error, setError] = useState<WorkspaceError>("");
  const [loading, setLoading] = useState(false);

  useBfcacheReset(() => setLoading(false));

  const normalized = subdomain.trim().toLowerCase();

  const handleCheck = useCallback(async () => {
    if (!normalized) return;

    setError("");
    setLoading(true);

    try {
      const result = await checkTenant(normalized);

      if (result.exists && result.status === "suspended") {
        setError("suspended");
        return;
      }

      if (result.exists) {
        navigateToTenant(normalized, redirectPath);
        return;
      }

      setError("not_found");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [normalized, redirectPath]);

  const clearError = useCallback(() => setError(""), []);

  return { subdomain, setSubdomain, normalized, error, loading, clearError, handleCheck };
}
