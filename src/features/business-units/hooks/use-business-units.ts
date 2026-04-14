"use client";

import { useState, useEffect, useCallback } from "react";
import {
  listBusinessUnits,
  createBusinessUnit,
  updateBusinessUnit,
  deleteBusinessUnit,
} from "@/services/business-unit-service";
import type { BusinessUnit, BusinessUnitFormData, ApiError } from "@/types";

interface UseBusinessUnitsReturn {
  units: BusinessUnit[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  add: (data: BusinessUnitFormData) => Promise<boolean>;
  update: (id: string, data: Partial<BusinessUnitFormData>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  formError: string;
  fieldErrors: Record<string, string[]>;
  clearFormErrors: () => void;
}

export function useBusinessUnits(): UseBusinessUnitsReturn {
  const [units, setUnits] = useState<BusinessUnit[]>([]);
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
      const data = await listBusinessUnits();
      setUnits(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to load business units.");
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(async (data: BusinessUnitFormData): Promise<boolean> => {
    clearFormErrors();
    try {
      await createBusinessUnit(data);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors) setFieldErrors(apiError.errors);
      else setFormError(apiError.error || "Failed to create business unit.");
      return false;
    }
  }, [refresh, clearFormErrors]);

  const update = useCallback(async (id: string, data: Partial<BusinessUnitFormData>): Promise<boolean> => {
    clearFormErrors();
    try {
      await updateBusinessUnit(id, data);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors) setFieldErrors(apiError.errors);
      else setFormError(apiError.error || "Failed to update business unit.");
      return false;
    }
  }, [refresh, clearFormErrors]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteBusinessUnit(id);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to delete business unit.");
      return false;
    }
  }, [refresh]);

  useEffect(() => { refresh(); }, [refresh]);

  return { units, loading, error, refresh, add, update, remove, formError, fieldErrors, clearFormErrors };
}
