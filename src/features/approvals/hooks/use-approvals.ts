"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getWorkflowInstances,
  type WorkflowInstanceListParams,
} from "@/services/workflow-service";
import type { WorkflowInstance } from "@/types";

interface UseApprovalsReturn {
  instances: WorkflowInstance[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
}

export function useApprovals(
  params?: WorkflowInstanceListParams
): UseApprovalsReturn {
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getWorkflowInstances(params);
      setInstances(data);
    } catch {
      setError("Failed to load approvals.");
    } finally {
      setLoading(false);
    }
  }, [params?.my_pending, params?.status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { instances, loading, error, refresh };
}
