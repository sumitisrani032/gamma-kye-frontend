"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getWorkflowDefinition,
  createWorkflowDefinition,
  updateWorkflowDefinition,
} from "@/services/workflow-service";
import type { ApiError, CreateStepRequest, RejectAction } from "@/types";

interface WorkflowFormState {
  name: string;
  entity_type: string;
  is_active: boolean;
  steps: CreateStepRequest[];
}

const EMPTY_STEP: CreateStepRequest = {
  step_order: 1,
  approver_type: "reporting_manager",
  action_on_reject: "terminate",
  auto_escalation_hours: null,
};

const INITIAL_STATE: WorkflowFormState = {
  name: "",
  entity_type: "leave_request",
  is_active: true,
  steps: [{ ...EMPTY_STEP }],
};

interface UseWorkflowFormReturn {
  form: WorkflowFormState;
  loading: boolean;
  saving: boolean;
  error: string;
  fieldErrors: Record<string, string[]>;
  setField: <K extends keyof WorkflowFormState>(
    key: K,
    value: WorkflowFormState[K]
  ) => void;
  setStep: (index: number, step: CreateStepRequest) => void;
  addStep: () => void;
  removeStep: (index: number) => void;
  moveStep: (from: number, to: number) => void;
  handleSubmit: () => Promise<boolean>;
}

export function useWorkflowForm(editId?: string): UseWorkflowFormReturn {
  const [form, setForm] = useState<WorkflowFormState>(INITIAL_STATE);
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Load existing definition for editing
  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const def = await getWorkflowDefinition(editId);
        setForm({
          name: def.name,
          entity_type: def.entity_type,
          is_active: def.is_active,
          steps: def.steps.map((s) => ({
            step_order: s.step_order,
            approver_type: s.approver_type,
            action_on_reject: s.action_on_reject,
            auto_escalation_hours: s.auto_escalation_hours,
          })),
        });
      } catch {
        setError("Failed to load workflow definition.");
      } finally {
        setLoading(false);
      }
    })();
  }, [editId]);

  const setField = useCallback(
    <K extends keyof WorkflowFormState>(key: K, value: WorkflowFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const setStep = useCallback((index: number, step: CreateStepRequest) => {
    setForm((prev) => {
      const steps = [...prev.steps];
      steps[index] = step;
      return { ...prev, steps };
    });
  }, []);

  const addStep = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        { ...EMPTY_STEP, step_order: prev.steps.length + 1 },
      ],
    }));
  }, []);

  const removeStep = useCallback((index: number) => {
    setForm((prev) => {
      const steps = prev.steps
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, step_order: i + 1 }));
      return { ...prev, steps };
    });
  }, []);

  const moveStep = useCallback((from: number, to: number) => {
    setForm((prev) => {
      const steps = [...prev.steps];
      const [moved] = steps.splice(from, 1);
      steps.splice(to, 0, moved);
      return {
        ...prev,
        steps: steps.map((s, i) => ({ ...s, step_order: i + 1 })),
      };
    });
  }, []);

  const handleSubmit = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    setError("");
    setFieldErrors({});
    try {
      if (editId) {
        await updateWorkflowDefinition(editId, form);
      } else {
        await createWorkflowDefinition(form);
      }
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors) {
        setFieldErrors(apiError.errors);
      } else {
        setError(apiError.error || "Failed to save workflow definition.");
      }
      return false;
    } finally {
      setSaving(false);
    }
  }, [editId, form]);

  return {
    form,
    loading,
    saving,
    error,
    fieldErrors,
    setField,
    setStep,
    addStep,
    removeStep,
    moveStep,
    handleSubmit,
  };
}

export { EMPTY_STEP };
export type { WorkflowFormState, RejectAction };
