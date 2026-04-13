"use client";

import { useState, useEffect, useCallback } from "react";
import { getRoles, deleteRole } from "@/services/role-service";
import type { RoleSummary, ApiError } from "@/types";

interface UseRolesReturn {
  roles: RoleSummary[];
  loading: boolean;
  error: string;
  remove: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useRoles(): UseRolesReturn {
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRoles(await getRoles());
    } catch {
      setError("Failed to load roles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    setError("");
    try {
      await deleteRole(id);
      setRoles((prev) => prev.filter((r) => r.id !== id));
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to delete role.");
      return false;
    }
  }, []);

  return { roles, loading, error, remove, refresh };
}
