"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getWorkflowDefinitions,
  deleteWorkflowDefinition,
} from "@/services/workflow-service";
import type { WorkflowDefinition, ApiError } from "@/types";

interface UseWorkflowDefinitionsReturn {
  definitions: WorkflowDefinition[];
  loading: boolean;
  error: string;
  remove: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useWorkflowDefinitions(): UseWorkflowDefinitionsReturn {
  const [definitions, setDefinitions] = useState<WorkflowDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getWorkflowDefinitions();
      setDefinitions(data);
    } catch {
      setError("Failed to load workflow definitions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteWorkflowDefinition(id);
        setDefinitions((prev) => prev.filter((d) => d.id !== id));
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.error || "Failed to delete.");
      }
    },
    []
  );

  return { definitions, loading, error, remove, refresh };
}
