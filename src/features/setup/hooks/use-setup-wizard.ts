"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSetupStatus, completeSetup } from "@/services/tenant-service";
import type { SetupStatusResponse, ApiError } from "@/types";

interface UseSetupWizardReturn {
  status: SetupStatusResponse | null;
  loading: boolean;
  completing: boolean;
  error: string;
  refresh: () => Promise<void>;
  handleComplete: () => Promise<void>;
}

export function useSetupWizard(): UseSetupWizardReturn {
  const [status, setStatus] = useState<SetupStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const refresh = useCallback(async () => {
    setError("");
    try {
      const data = await getSetupStatus();
      setStatus(data);

      if (!data.setup_required) {
        router.replace("/dashboard");
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to load setup status.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleComplete = useCallback(async () => {
    setError("");
    setCompleting(true);
    try {
      await completeSetup();
      router.replace("/dashboard");
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to complete setup.");
    } finally {
      setCompleting(false);
    }
  }, [router]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, loading, completing, error, refresh, handleComplete };
}
