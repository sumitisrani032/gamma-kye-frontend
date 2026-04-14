"use client";

import { useState, useEffect, useCallback } from "react";
import {
  listLeavePolicies,
  getLeavePolicy,
  createLeavePolicy,
  updateLeavePolicy,
  deleteLeavePolicy,
} from "@/services/leave-policy-service";
import type { LeavePolicySummary, LeavePolicyDetail, LeavePolicyFormData, ApiError } from "@/types";

interface UseLeavePoliciesReturn {
  policies: LeavePolicySummary[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  fetchDetail: (id: string) => Promise<LeavePolicyDetail | null>;
  add: (data: LeavePolicyFormData) => Promise<boolean>;
  update: (id: string, data: Partial<LeavePolicyFormData>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  formError: string;
  fieldErrors: Record<string, string[]>;
  clearFormErrors: () => void;
}

export function useLeavePolicies(): UseLeavePoliciesReturn {
  const [policies, setPolicies] = useState<LeavePolicySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const clearFormErrors = useCallback(() => {
    setFormError("");
    setFieldErrors({});
  }, []);

  const refresh = useCallback(async () => {
    setError("");
    try {
      const data = await listLeavePolicies();
      setPolicies(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to load leave policies.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDetail = useCallback(async (id: string): Promise<LeavePolicyDetail | null> => {
    try {
      return await getLeavePolicy(id);
    } catch {
      return null;
    }
  }, []);

  const add = useCallback(async (data: LeavePolicyFormData): Promise<boolean> => {
    clearFormErrors();
    try {
      await createLeavePolicy(data);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors) setFieldErrors(apiError.errors);
      else setFormError(apiError.error || "Failed to create leave policy.");
      return false;
    }
  }, [refresh, clearFormErrors]);

  const update = useCallback(async (id: string, data: Partial<LeavePolicyFormData>): Promise<boolean> => {
    clearFormErrors();
    try {
      await updateLeavePolicy(id, data);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors) setFieldErrors(apiError.errors);
      else setFormError(apiError.error || "Failed to update leave policy.");
      return false;
    }
  }, [refresh, clearFormErrors]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteLeavePolicy(id);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to delete leave policy.");
      return false;
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { policies, loading, error, refresh, fetchDetail, add, update, remove, formError, fieldErrors, clearFormErrors };
}
