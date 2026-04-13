"use client";

import { useRouter } from "next/navigation";
import { Button, Input, Select, Alert } from "@/components/ui";
import { useWorkflowForm } from "../hooks/use-workflow-form";
import { StepEditor } from "./step-editor";

const ENTITY_TYPES = [
  { value: "leave_request", label: "Leave Request" },
  { value: "expense_claim", label: "Expense Claim" },
  { value: "employee_onboarding", label: "Onboarding" },
  { value: "employee_offboarding", label: "Offboarding" },
];

interface WorkflowFormProps {
  editId?: string;
}

export function WorkflowForm({ editId }: WorkflowFormProps) {
  const router = useRouter();
  const {
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
  } = useWorkflowForm(editId);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await handleSubmit();
    if (success) {
      router.push("/settings/workflows");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">
          {editId ? "Edit" : "New"} Workflow Definition
        </h2>

        <Input
          label="Name"
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          placeholder="Leave Approval Workflow"
          required
          error={fieldErrors["name"]?.[0]}
        />

        <Select
          label="Entity Type"
          value={form.entity_type}
          onChange={(e) => setField("entity_type", e.target.value)}
          options={ENTITY_TYPES}
          error={fieldErrors["entity_type"]?.[0]}
        />

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setField("is_active", e.target.checked)}
            className="rounded border-border text-primary-600 focus:ring-primary-500"
          />
          <span className="text-text-primary font-medium">Active</span>
        </label>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">
            Approval Steps
          </h3>
          <Button type="button" variant="secondary" size="sm" onClick={addStep}>
            Add Step
          </Button>
        </div>

        {form.steps.length === 0 && (
          <p className="text-sm text-text-muted text-center py-4">
            Add at least one approval step.
          </p>
        )}

        <div className="space-y-3">
          {form.steps.map((step, index) => (
            <StepEditor
              key={index}
              step={step}
              index={index}
              total={form.steps.length}
              onChange={(updated) => setStep(index, updated)}
              onRemove={() => removeStep(index)}
              onMoveUp={index > 0 ? () => moveStep(index, index - 1) : undefined}
              onMoveDown={
                index < form.steps.length - 1
                  ? () => moveStep(index, index + 1)
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={saving}>
          {editId ? "Save Changes" : "Create Workflow"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/settings/workflows")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
