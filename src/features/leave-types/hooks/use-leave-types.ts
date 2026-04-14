"use client";

import { useState, useEffect, useCallback } from "react";
import {
  listLeaveTypes,
  getLeaveType,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
} from "@/services/leave-type-service";
import type { LeaveTypeSummary, LeaveTypeDetail, LeaveTypeFormData, ApiError } from "@/types";

interface UseLeaveTypesReturn {
  leaveTypes: LeaveTypeSummary[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  fetchDetail: (id: string) => Promise<LeaveTypeDetail | null>;
  add: (data: LeaveTypeFormData) => Promise<boolean>;
  update: (id: string, data: Partial<LeaveTypeFormData>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  formError: string;
  fieldErrors: Record<string, string[]>;
  clearFormErrors: () => void;
}

export function useLeaveTypes(): UseLeaveTypesReturn {
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeSummary[]>([]);
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
      const data = await listLeaveTypes();
      setLeaveTypes(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to load leave types.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDetail = useCallback(async (id: string): Promise<LeaveTypeDetail | null> => {
    try {
      return await getLeaveType(id);
    } catch {
      return null;
    }
  }, []);

  const add = useCallback(async (data: LeaveTypeFormData): Promise<boolean> => {
    clearFormErrors();
    try {
      await createLeaveType(data);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors) setFieldErrors(apiError.errors);
      else setFormError(apiError.error || "Failed to create leave type.");
      return false;
    }
  }, [refresh, clearFormErrors]);

  const update = useCallback(async (id: string, data: Partial<LeaveTypeFormData>): Promise<boolean> => {
    clearFormErrors();
    try {
      await updateLeaveType(id, data);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors) setFieldErrors(apiError.errors);
      else setFormError(apiError.error || "Failed to update leave type.");
      return false;
    }
  }, [refresh, clearFormErrors]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteLeaveType(id);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to delete leave type.");
      return false;
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { leaveTypes, loading, error, refresh, fetchDetail, add, update, remove, formError, fieldErrors, clearFormErrors };
}
