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
  /** Last successful apply — populated so the UI can show "submitted" vs "auto-approved". */
  successMessage: string;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  refresh: () => Promise<void>;
  apply: (data: LeaveRequestFormData) => Promise<boolean>;
  cancel: (id: string, reason: string) => Promise<boolean>;
  clearFormErrors: () => void;
  clearSuccess: () => void;
}

export function useLeaves(): UseLeavesReturn {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [myEmployeeId, setMyEmployeeId] = useState<string | null>(null);
  const [profileReady, setProfileReady] = useState(false);

  const clearFormErrors = useCallback(() => {
    setFormError("");
    setFieldErrors({});
  }, []);

  const clearSuccess = useCallback(() => setSuccessMessage(""), []);

  // Step 1: Resolve employee ID first — nothing renders until this completes
  useEffect(() => {
    getMyProfile()
      .then((p) => setMyEmployeeId(p.employee.id))
      .catch(() => {})
      .finally(() => setProfileReady(true));
  }, []);

  // Step 2: Only fetch leave data after employee ID is known
  const refresh = useCallback(async () => {
    if (!profileReady) return;
    setError("");
    try {
      const [bal, reqs] = await Promise.all([
        getLeaveBalances(),
        listLeaveRequests(statusFilter || undefined),
      ]);
      setBalances(bal);
      // Filter to own requests only (backend may return org-wide for admin)
      setRequests(myEmployeeId ? reqs.filter((r) => r.employee.id === myEmployeeId) : reqs);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to load leave data.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, myEmployeeId, profileReady]);

  useEffect(() => { refresh(); }, [refresh]);

  const apply = useCallback(async (data: LeaveRequestFormData): Promise<boolean> => {
    clearFormErrors();
    setSuccessMessage("");
    try {
      // Backend auto-approves senior roles (e.g. Tenant Admin / CEO) when all
      // workflow steps end up skipped — read the response status to know.
      const created = await applyLeave(data);
      await refresh();
      setSuccessMessage(
        created.status === "approved"
          ? "Leave approved automatically."
          : "Leave request submitted for approval.",
      );
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
      // Cancelling a leave may unblock overlapping WFH requests — nudge attendance view to refetch.
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("wfh:invalidate"));
      }
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to cancel leave request.");
      return false;
    }
  }, [refresh]);

  return { balances, requests, loading, error, formError, fieldErrors, successMessage, statusFilter, setStatusFilter, refresh, apply, cancel, clearFormErrors, clearSuccess };
}
