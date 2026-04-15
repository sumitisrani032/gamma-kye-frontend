"use client";

import { useState, useEffect, useCallback } from "react";
import { listWfhPolicies, getWfhPolicy, createWfhPolicy, updateWfhPolicy, deleteWfhPolicy } from "@/services/wfh-policy-service";
import type { WfhPolicy, WfhPolicyFormData, ApiError } from "@/types";

interface UseWfhPoliciesReturn {
  policies: WfhPolicy[];
  selected: WfhPolicy | null;
  loading: boolean;
  error: string;
  formError: string;
  refresh: () => Promise<void>;
  select: (id: string) => Promise<void>;
  clearSelection: () => void;
  add: (data: WfhPolicyFormData) => Promise<boolean>;
  update: (id: string, data: Partial<WfhPolicyFormData>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  clearFormErrors: () => void;
}

export function useWfhPolicies(): UseWfhPoliciesReturn {
  const [policies, setPolicies] = useState<WfhPolicy[]>([]);
  const [selected, setSelected] = useState<WfhPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const clearFormErrors = useCallback(() => setFormError(""), []);

  const refresh = useCallback(async () => {
    setError("");
    try {
      setPolicies(await listWfhPolicies());
    } catch (err) {
      setError((err as ApiError).error || "Failed to load WFH policies.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const select = useCallback(async (id: string) => {
    try {
      setSelected(await getWfhPolicy(id));
    } catch (err) {
      setError((err as ApiError).error || "Failed to load policy details.");
    }
  }, []);

  const clearSelection = useCallback(() => setSelected(null), []);

  const add = useCallback(async (data: WfhPolicyFormData): Promise<boolean> => {
    setFormError("");
    try {
      await createWfhPolicy(data);
      await refresh();
      return true;
    } catch (err) {
      const e = err as ApiError;
      setFormError(e.errors ? Object.values(e.errors).flat().join(", ") : e.error || "Failed to create.");
      return false;
    }
  }, [refresh]);

  const update = useCallback(async (id: string, data: Partial<WfhPolicyFormData>): Promise<boolean> => {
    setFormError("");
    try {
      await updateWfhPolicy(id, data);
      await refresh();
      return true;
    } catch (err) {
      const e = err as ApiError;
      setFormError(e.errors ? Object.values(e.errors).flat().join(", ") : e.error || "Failed to update.");
      return false;
    }
  }, [refresh]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteWfhPolicy(id);
      await refresh();
      if (selected?.id === id) setSelected(null);
      return true;
    } catch (err) {
      setError((err as ApiError).error || "Failed to delete.");
      return false;
    }
  }, [refresh, selected]);

  return { policies, selected, loading, error, formError, refresh, select, clearSelection, add, update, remove, clearFormErrors };
}
