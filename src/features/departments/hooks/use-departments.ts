"use client";

import { useState, useEffect, useCallback } from "react";
import {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "@/services/department-service";
import type { DepartmentSummary, DepartmentFormData, ApiError } from "@/types";

interface UseDepartmentsReturn {
  departments: DepartmentSummary[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  add: (data: DepartmentFormData) => Promise<boolean>;
  update: (id: string, data: Partial<DepartmentFormData>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  formError: string;
  fieldErrors: Record<string, string[]>;
  clearFormErrors: () => void;
}

export function useDepartments(): UseDepartmentsReturn {
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
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
      const data = await listDepartments();
      setDepartments(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to load departments.");
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(async (data: DepartmentFormData): Promise<boolean> => {
    clearFormErrors();
    try {
      await createDepartment(data);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors) setFieldErrors(apiError.errors);
      else setFormError(apiError.error || "Failed to create department.");
      return false;
    }
  }, [refresh, clearFormErrors]);

  const update = useCallback(async (id: string, data: Partial<DepartmentFormData>): Promise<boolean> => {
    clearFormErrors();
    try {
      await updateDepartment(id, data);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors) setFieldErrors(apiError.errors);
      else setFormError(apiError.error || "Failed to update department.");
      return false;
    }
  }, [refresh, clearFormErrors]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteDepartment(id);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to delete department.");
      return false;
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { departments, loading, error, refresh, add, update, remove, formError, fieldErrors, clearFormErrors };
}
