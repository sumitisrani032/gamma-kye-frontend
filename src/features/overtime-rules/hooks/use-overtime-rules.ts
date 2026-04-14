"use client";

import { useState, useEffect, useCallback } from "react";
import { listOvertimeRules, createOvertimeRule, updateOvertimeRule } from "@/services/overtime-rule-service";
import type { OvertimeRule, OvertimeRuleFormData, ApiError } from "@/types";

interface UseOvertimeRulesReturn {
  rules: OvertimeRule[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  add: (data: OvertimeRuleFormData) => Promise<boolean>;
  update: (id: string, data: Partial<OvertimeRuleFormData>) => Promise<boolean>;
  formError: string;
  fieldErrors: Record<string, string[]>;
  clearFormErrors: () => void;
}

export function useOvertimeRules(): UseOvertimeRulesReturn {
  const [rules, setRules] = useState<OvertimeRule[]>([]);
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
      const data = await listOvertimeRules();
      setRules(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to load overtime rules.");
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(async (data: OvertimeRuleFormData): Promise<boolean> => {
    clearFormErrors();
    try {
      await createOvertimeRule(data);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors) setFieldErrors(apiError.errors);
      else setFormError(apiError.error || "Failed to create overtime rule.");
      return false;
    }
  }, [refresh, clearFormErrors]);

  const update = useCallback(async (id: string, data: Partial<OvertimeRuleFormData>): Promise<boolean> => {
    clearFormErrors();
    try {
      await updateOvertimeRule(id, data);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors) setFieldErrors(apiError.errors);
      else setFormError(apiError.error || "Failed to update overtime rule.");
      return false;
    }
  }, [refresh, clearFormErrors]);

  useEffect(() => { refresh(); }, [refresh]);

  return { rules, loading, error, refresh, add, update, formError, fieldErrors, clearFormErrors };
}
