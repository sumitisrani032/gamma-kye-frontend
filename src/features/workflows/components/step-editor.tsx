"use client";

import { Select, Input, Button } from "@/components/ui";
import type { CreateStepRequest, RejectAction } from "@/types";

const APPROVER_TYPES = [
  { value: "reporting_manager", label: "Reporting Manager" },
  { value: "department_head", label: "Department Head" },
  { value: "specific_user", label: "Specific User" },
  { value: "role:HR Manager", label: "Role: HR Manager" },
  { value: "role:HR Director", label: "Role: HR Director" },
  { value: "role:Tenant Admin", label: "Role: Tenant Admin" },
];

const REJECT_ACTIONS: { value: RejectAction; label: string }[] = [
  { value: "terminate", label: "Terminate Workflow" },
  { value: "send_back", label: "Send Back to Previous Step" },
  { value: "skip", label: "Skip This Step" },
];

interface StepEditorProps {
  step: CreateStepRequest;
  index: number;
  total: number;
  onChange: (step: CreateStepRequest) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function StepEditor({
  step,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: StepEditorProps) {
  return (
    <div className="rounded-lg border border-border bg-surface-secondary p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Step {index + 1}
        </span>
        <div className="flex items-center gap-1">
          {onMoveUp && (
            <button
              type="button"
              onClick={onMoveUp}
              className="rounded p-1 text-text-muted hover:text-text-primary hover:bg-surface-tertiary"
              title="Move up"
            >
              <ArrowUpIcon className="h-4 w-4" />
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              onClick={onMoveDown}
              className="rounded p-1 text-text-muted hover:text-text-primary hover:bg-surface-tertiary"
              title="Move down"
            >
              <ArrowDownIcon className="h-4 w-4" />
            </button>
          )}
          {total > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
            >
              Remove
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          label="Approver"
          value={step.approver_type}
          onChange={(e) =>
            onChange({ ...step, approver_type: e.target.value })
          }
          options={APPROVER_TYPES}
        />
        <Select
          label="On Reject"
          value={step.action_on_reject}
          onChange={(e) =>
            onChange({
              ...step,
              action_on_reject: e.target.value as RejectAction,
            })
          }
          options={REJECT_ACTIONS}
        />
      </div>

      <Input
        label="Auto-escalation (hours)"
        type="number"
        value={step.auto_escalation_hours ?? ""}
        onChange={(e) =>
          onChange({
            ...step,
            auto_escalation_hours: e.target.value
              ? Number(e.target.value)
              : null,
          })
        }
        placeholder="Leave blank to disable"
      />
    </div>
  );
}

function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  );
}

function ArrowDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}
