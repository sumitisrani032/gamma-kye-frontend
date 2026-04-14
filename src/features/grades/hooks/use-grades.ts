"use client";

import { useState, useEffect, useCallback } from "react";
import {
  listGrades,
  createGrade,
  updateGrade,
  deleteGrade,
} from "@/services/grade-service";
import type { Grade, GradeFormData, ApiError } from "@/types";

interface UseGradesReturn {
  grades: Grade[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  add: (data: GradeFormData) => Promise<boolean>;
  update: (id: string, data: Partial<GradeFormData>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  formError: string;
  fieldErrors: Record<string, string[]>;
  clearFormErrors: () => void;
}

export function useGrades(): UseGradesReturn {
  const [grades, setGrades] = useState<Grade[]>([]);
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
      const data = await listGrades();
      setGrades(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to load grades.");
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(async (data: GradeFormData): Promise<boolean> => {
    clearFormErrors();
    try {
      await createGrade(data);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors) setFieldErrors(apiError.errors);
      else setFormError(apiError.error || "Failed to create grade.");
      return false;
    }
  }, [refresh, clearFormErrors]);

  const update = useCallback(async (id: string, data: Partial<GradeFormData>): Promise<boolean> => {
    clearFormErrors();
    try {
      await updateGrade(id, data);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors) setFieldErrors(apiError.errors);
      else setFormError(apiError.error || "Failed to update grade.");
      return false;
    }
  }, [refresh, clearFormErrors]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteGrade(id);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to delete grade.");
      return false;
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { grades, loading, error, refresh, add, update, remove, formError, fieldErrors, clearFormErrors };
}
