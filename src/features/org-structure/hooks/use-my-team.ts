"use client";

import { useState, useEffect, useCallback } from "react";
import { getMyTeam } from "../services/org-service";
import type { MyTeamData, ApiError } from "@/types";

interface UseMyTeamReturn {
  team: MyTeamData | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
}

export function useMyTeam(employeeId: string | null): UseMyTeamReturn {
  const [team, setTeam] = useState<MyTeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!employeeId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await getMyTeam(employeeId);
      setTeam(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to load team data.");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { team, loading, error, refresh };
}
