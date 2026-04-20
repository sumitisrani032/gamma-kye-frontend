import { StatusBadge } from "@/components/common/status-badge";
import type { StepInstance } from "@/types";

interface StepTimelineProps {
  steps: StepInstance[];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StepTimeline({ steps }: StepTimelineProps) {
  const sorted = [...steps].sort((a, b) => a.step_order - b.step_order);

  return (
    <div className="space-y-0">
      {sorted.map((step, idx) => (
        <div key={step.id} className="relative flex gap-4 pb-6 last:pb-0">
          {/* Vertical connector line */}
          {idx < sorted.length - 1 && (
            <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-border" />
          )}

          {/* Step dot */}
          <div
            className={`relative z-10 mt-1 h-6 w-6 shrink-0 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
              step.status === "approved"
                ? "border-green-500 bg-green-50 text-green-700"
                : step.status === "rejected"
                  ? "border-red-500 bg-red-50 text-red-700"
                  : step.status === "in_progress"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : step.status === "skipped"
                      ? "border-border bg-surface-tertiary text-text-muted"
                      : "border-border bg-surface text-text-muted"
            }`}
          >
            {step.step_order}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-primary capitalize">
                {step.approver_type.replace("_", " ")}
              </span>
              <StatusBadge status={step.status} />
            </div>

            {step.assigned_to ? (
              <p className="mt-0.5 text-xs text-text-secondary">
                {step.assigned_to.first_name} {step.assigned_to.last_name} (
                {step.assigned_to.email})
              </p>
            ) : step.status === "skipped" ? (
              <p className="mt-0.5 text-xs text-text-muted italic">
                Auto-skipped
              </p>
            ) : null}

            {step.comments && (
              <p className="mt-1 text-xs text-text-secondary italic">
                &ldquo;{step.comments}&rdquo;
              </p>
            )}

            {step.acted_at && (
              <p className="mt-0.5 text-xs text-text-muted">
                {formatDate(step.acted_at)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
