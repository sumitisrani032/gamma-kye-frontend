"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Input, Select, Card, CardContent, Alert } from "@/components/ui";
import {
  getWorkflowDefinitions,
  createWorkflowDefinition,
  deleteWorkflowDefinition,
} from "@/services/workflow-service";
import type { WorkflowDefinitionSummary, CreateStepRequest, ApiError } from "@/types";

interface WorkflowSetupListProps {
  onDataChange?: () => void;
  entityType?: string;
  label?: string;
}

const APPROVER_OPTIONS = [
  { value: "reporting_manager", label: "Reporting Manager" },
  { value: "department_head", label: "Department Head" },
  { value: "role:HR Manager", label: "HR Manager (Role)" },
  { value: "role:Tenant Admin", label: "Tenant Admin (Role)" },
];

const REJECT_OPTIONS = [
  { value: "terminate", label: "Terminate" },
  { value: "send_back", label: "Send Back" },
  { value: "skip", label: "Skip" },
];

const ENTITY_DEFAULTS: Record<string, { name: string; label: string }> = {
  leave_request: { name: "Leave Approval", label: "leave approval" },
  attendance_regularization: { name: "Regularization Approval", label: "regularization" },
};

export function WorkflowSetupList({ onDataChange, entityType = "leave_request", label }: WorkflowSetupListProps) {
  const defaults = ENTITY_DEFAULTS[entityType] || { name: entityType, label: entityType };
  const displayLabel = label || defaults.label;

  const [definitions, setDefinitions] = useState<WorkflowDefinitionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState(defaults.name);
  const [steps, setSteps] = useState<CreateStepRequest[]>([
    { step_order: 1, approver_type: "reporting_manager", action_on_reject: "terminate", auto_escalation_hours: null },
  ]);

  const refresh = useCallback(async () => {
    setError("");
    try {
      const data = await getWorkflowDefinitions(entityType);
      setDefinitions(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to load workflows.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await createWorkflowDefinition({
        workflow_definition: { name, entity_type: entityType, is_active: true },
        steps,
      });
      await refresh();
      setShowForm(false);
      onDataChange?.();
    } catch (err) {
      const apiError = err as ApiError;
      setFormError(apiError.error || "Failed to create workflow.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWorkflowDefinition(id);
      await refresh();
      onDataChange?.();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to delete workflow.");
    }
  };

  const updateStep = (index: number, field: string, value: string | number | null) => {
    setSteps((prev) => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const addStep = () => {
    setSteps((prev) => [...prev, { step_order: prev.length + 1, approver_type: "reporting_manager", action_on_reject: "terminate", auto_escalation_hours: null }]);
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, step_order: i + 1 })));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {definitions.length} {displayLabel} {definitions.length === 1 ? "workflow" : "workflows"} configured
        </p>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>Add Workflow</Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardContent>
            <h3 className="text-sm font-semibold text-text-primary mb-4">New {defaults.name} Workflow</h3>
            {formError && <Alert variant="error" className="mb-3">{formError}</Alert>}
            <form onSubmit={handleCreate} className="space-y-4">
              <Input label="Workflow Name" value={name} onChange={(e) => setName(e.target.value)} required />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-primary">Approval Steps</label>
                {steps.map((step, i) => (
                  <div key={i} className="flex items-end gap-2 p-3 bg-surface-secondary rounded-lg">
                    <span className="text-xs font-medium text-text-muted pb-2">#{step.step_order}</span>
                    <Select label="Approver" name={`approver_${i}`} value={step.approver_type} onChange={(e) => updateStep(i, "approver_type", e.target.value)} options={APPROVER_OPTIONS} />
                    <Select label="On Reject" name={`reject_${i}`} value={step.action_on_reject} onChange={(e) => updateStep(i, "action_on_reject", e.target.value)} options={REJECT_OPTIONS} />
                    <Input label="Escalate (hrs)" name={`esc_${i}`} type="number" value={step.auto_escalation_hours != null ? String(step.auto_escalation_hours) : ""} onChange={(e) => updateStep(i, "auto_escalation_hours", e.target.value ? Number(e.target.value) : null)} placeholder="—" />
                    {steps.length > 1 && (
                      <Button type="button" size="sm" variant="ghost" className="text-danger" onClick={() => removeStep(i)}>X</Button>
                    )}
                  </div>
                ))}
                <Button type="button" size="sm" variant="secondary" onClick={addStep}>+ Add Step</Button>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" loading={submitting}>Create Workflow</Button>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {definitions.length > 0 && (
        <div className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
          {definitions.map((def) => (
            <div key={def.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text-primary truncate">{def.name}</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${def.is_active ? "bg-green-100 text-green-700" : "bg-surface-tertiary text-text-muted"}`}>
                    {def.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  {def.steps_count} {def.steps_count === 1 ? "step" : "steps"}
                </p>
              </div>
              <Button size="sm" variant="ghost" className="text-danger" onClick={() => handleDelete(def.id)}>
                Delete
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
