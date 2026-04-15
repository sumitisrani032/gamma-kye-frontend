"use client";

import { useState, useEffect, useCallback } from "react";
import { listPolicies, getPendingAcknowledgements, acknowledgePolicy } from "@/services/policy-document-service";
import type { PolicyDocument, ApiError } from "@/types";

interface UsePoliciesReturn {
  policies: PolicyDocument[];
  pending: PolicyDocument[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  acknowledge: (id: string) => Promise<boolean>;
}

export function usePolicies(): UsePoliciesReturn {
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [pending, setPending] = useState<PolicyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    try {
      const [all, pend] = await Promise.all([listPolicies(), getPendingAcknowledgements()]);
      setPolicies(all);
      setPending(pend);
    } catch (err) {
      setError((err as ApiError).error || "Failed to load policies.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const acknowledge = useCallback(async (id: string): Promise<boolean> => {
    try {
      await acknowledgePolicy(id);
      await refresh();
      return true;
    } catch (err) {
      setError((err as ApiError).error || "Failed to acknowledge.");
      return false;
    }
  }, [refresh]);

  return { policies, pending, loading, error, refresh, acknowledge };
}
