"use client";

import { useState, useEffect, useCallback } from "react";
import {
  listDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
} from "@/services/designation-service";
import type { Designation, DesignationFormData, ApiError } from "@/types";

interface UseDesignationsReturn {
  designations: Designation[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  add: (data: DesignationFormData) => Promise<boolean>;
  update: (id: string, data: Partial<DesignationFormData>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  formError: string;
  fieldErrors: Record<string, string[]>;
  clearFormErrors: () => void;
}

export function useDesignations(): UseDesignationsReturn {
  const [designations, setDesignations] = useState<Designation[]>([]);
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
      const data = await listDesignations();
      setDesignations(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to load designations.");
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(async (data: DesignationFormData): Promise<boolean> => {
    clearFormErrors();
    try {
      await createDesignation(data);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors) setFieldErrors(apiError.errors);
      else setFormError(apiError.error || "Failed to create designation.");
      return false;
    }
  }, [refresh, clearFormErrors]);

  const update = useCallback(async (id: string, data: Partial<DesignationFormData>): Promise<boolean> => {
    clearFormErrors();
    try {
      await updateDesignation(id, data);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors) setFieldErrors(apiError.errors);
      else setFormError(apiError.error || "Failed to update designation.");
      return false;
    }
  }, [refresh, clearFormErrors]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteDesignation(id);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to delete designation.");
      return false;
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { designations, loading, error, refresh, add, update, remove, formError, fieldErrors, clearFormErrors };
}
