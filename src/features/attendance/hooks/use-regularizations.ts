"use client";

import { useState, useEffect, useCallback } from "react";
import {
  listRegularizations,
  submitRegularization,
  cancelRegularization,
} from "@/services/regularization-service";
import { invalidateRequests, subscribeToInvalidate } from "@/lib/invalidate";
import type { RegularizationSummary, RegularizationFormData, ApiError } from "@/types";

interface UseRegularizationsReturn {
  regularizations: RegularizationSummary[];
  loading: boolean;
  error: string;
  formError: string;
  refresh: () => Promise<void>;
  submit: (data: RegularizationFormData) => Promise<boolean>;
  cancel: (id: string) => Promise<boolean>;
}

export function useRegularizations(): UseRegularizationsReturn {
  const [regularizations, setRegularizations] = useState<RegularizationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    try {
      const data = await listRegularizations();
      setRegularizations(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to load regularizations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => subscribeToInvalidate("attendance", refresh), [refresh]);

  const submit = useCallback(async (data: RegularizationFormData): Promise<boolean> => {
    setFormError("");
    try {
      // Backend now returns the full serialized regularization, so we can
      // prepend it optimistically instead of paying for a full list refetch.
      const created = await submitRegularization(data);
      setRegularizations((prev) => [created, ...prev]);
      invalidateRequests(["my_requests", "calendar", "attendance", "workflow_instances"]);
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      setFormError(apiError.error || "Failed to submit regularization.");
      return false;
    }
  }, []);

  const cancel = useCallback(async (id: string): Promise<boolean> => {
    try {
      await cancelRegularization(id);
      await refresh();
      invalidateRequests(["my_requests", "calendar", "attendance", "workflow_instances"]);
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to cancel regularization.");
      return false;
    }
  }, [refresh]);

  return { regularizations, loading, error, formError, refresh, submit, cancel };
}
