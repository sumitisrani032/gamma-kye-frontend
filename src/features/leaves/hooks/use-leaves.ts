"use client";

import { useState, useEffect, useCallback } from "react";
import { getLeaveBalances, listLeaveRequests, applyLeave, cancelLeaveRequest } from "@/services/leave-request-service";
import { getMyProfile } from "@/services/my-profile-service";
import type { LeaveBalance, LeaveRequest, LeaveRequestFormData, ApiError } from "@/types";

interface UseLeavesReturn {
  balances: LeaveBalance[];
  requests: LeaveRequest[];
  loading: boolean;
  error: string;
  formError: string;
  fieldErrors: Record<string, string[]>;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  refresh: () => Promise<void>;
  apply: (data: LeaveRequestFormData) => Promise<boolean>;
  cancel: (id: string, reason: string) => Promise<boolean>;
  clearFormErrors: () => void;
}

export function useLeaves(): UseLeavesReturn {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [statusFilter, setStatusFilter] = useState("");
  const [myEmployeeId, setMyEmployeeId] = useState<string | null>(null);

  const clearFormErrors = useCallback(() => {
    setFormError("");
    setFieldErrors({});
  }, []);

  // Resolve current user's employee ID once
  useEffect(() => {
    getMyProfile()
      .then((p) => setMyEmployeeId(p.employee.id))
      .catch(() => {});
  }, []);

  const refresh = useCallback(async () => {
    setError("");
    try {
      const [bal, reqs] = await Promise.all([
        getLeaveBalances(),
        listLeaveRequests(statusFilter || undefined),
      ]);
      setBalances(bal);
      // Filter to only current user's requests (backend may return org-wide for admins)
      if (myEmployeeId) {
        setRequests(reqs.filter((r) => r.employee.id === myEmployeeId));
      } else {
        setRequests(reqs);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to load leave data.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, myEmployeeId]);

  useEffect(() => { refresh(); }, [refresh]);

  const apply = useCallback(async (data: LeaveRequestFormData): Promise<boolean> => {
    clearFormErrors();
    try {
      await applyLeave(data);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors) setFieldErrors(apiError.errors);
      else setFormError(apiError.error || "Failed to apply leave.");
      return false;
    }
  }, [refresh, clearFormErrors]);

  const cancel = useCallback(async (id: string, reason: string): Promise<boolean> => {
    try {
      await cancelLeaveRequest(id, reason);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to cancel leave request.");
      return false;
    }
  }, [refresh]);

  return { balances, requests, loading, error, formError, fieldErrors, statusFilter, setStatusFilter, refresh, apply, cancel, clearFormErrors };
}
