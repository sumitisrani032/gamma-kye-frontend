import type { WorkflowStatus } from "@/types";

const STATUS_STYLES: Record<WorkflowStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-surface-tertiary text-text-muted",
  skipped: "bg-surface-tertiary text-text-muted",
};

interface StatusBadgeProps {
  status: WorkflowStatus;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        STATUS_STYLES[status] || STATUS_STYLES.pending
      } ${className}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
