"use client";

import { useState, useEffect, useCallback } from "react";
import { listShifts, createShift, updateShift, deleteShift } from "@/services/shift-service";
import type { Shift, ShiftFormData, ApiError } from "@/types";

interface UseShiftsReturn {
  shifts: Shift[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  add: (data: ShiftFormData) => Promise<boolean>;
  update: (id: string, data: Partial<ShiftFormData>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  formError: string;
  fieldErrors: Record<string, string[]>;
  clearFormErrors: () => void;
}

export function useShifts(): UseShiftsReturn {
  const [shifts, setShifts] = useState<Shift[]>([]);
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
      const data = await listShifts();
      setShifts(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to load shifts.");
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(async (data: ShiftFormData): Promise<boolean> => {
    clearFormErrors();
    try {
      await createShift(data);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors) setFieldErrors(apiError.errors);
      else setFormError(apiError.error || "Failed to create shift.");
      return false;
    }
  }, [refresh, clearFormErrors]);

  const update = useCallback(async (id: string, data: Partial<ShiftFormData>): Promise<boolean> => {
    clearFormErrors();
    try {
      await updateShift(id, data);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors) setFieldErrors(apiError.errors);
      else setFormError(apiError.error || "Failed to update shift.");
      return false;
    }
  }, [refresh, clearFormErrors]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteShift(id);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to delete shift.");
      return false;
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { shifts, loading, error, refresh, add, update, remove, formError, fieldErrors, clearFormErrors };
}
