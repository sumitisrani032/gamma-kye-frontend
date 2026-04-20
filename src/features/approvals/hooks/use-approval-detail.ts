"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getWorkflowInstance,
  approveWorkflow,
  rejectWorkflow,
  cancelWorkflow,
} from "@/services/workflow-service";
import { invalidateRequests } from "@/lib/invalidate";
import type { WorkflowInstanceDetail, ApiError } from "@/types";

interface UseApprovalDetailReturn {
  instance: WorkflowInstanceDetail | null;
  loading: boolean;
  error: string;
  actionLoading: boolean;
  actionError: string;
  approve: (comments: string) => Promise<void>;
  reject: (comments: string) => Promise<void>;
  cancel: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useApprovalDetail(id: string): UseApprovalDetailReturn {
  const [instance, setInstance] = useState<WorkflowInstanceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getWorkflowInstance(id);
      setInstance(data);
    } catch {
      setError("Failed to load approval details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const performAction = useCallback(
    async (action: () => Promise<WorkflowInstanceDetail>) => {
      setActionLoading(true);
      setActionError("");
      try {
        await action();
        // Refetch the full detail to get updated status + step_instances
        const fresh = await getWorkflowInstance(id);
        setInstance(fresh);
        // Any approval action can change downstream state — My Requests counts,
        // calendar day types, attendance records, balances. Notify everyone.
        invalidateRequests([
          "workflow_instances",
          "my_requests",
          "calendar",
          "attendance",
          "leave_balances",
          "wfh",
        ]);
        // Backend auto-cancels overlapping WFH requests when a leave is approved —
        // tell any legacy consumer (attendance page listener, etc.) to refetch.
        if (fresh.entity_type === "leave_request" && fresh.status === "approved" && typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("wfh:invalidate"));
        }
      } catch (err) {
        const apiError = err as ApiError;
        setActionError(apiError.error || "Action failed. Please try again.");
      } finally {
        setActionLoading(false);
      }
    },
    [id]
  );

  const approve = useCallback(
    (comments: string) => performAction(() => approveWorkflow(id, comments)),
    [id, performAction]
  );

  const reject = useCallback(
    (comments: string) => performAction(() => rejectWorkflow(id, comments)),
    [id, performAction]
  );

  const cancel = useCallback(
    () => performAction(() => cancelWorkflow(id)),
    [id, performAction]
  );

  return {
    instance,
    loading,
    error,
    actionLoading,
    actionError,
    approve,
    reject,
    cancel,
    refresh,
  };
}
