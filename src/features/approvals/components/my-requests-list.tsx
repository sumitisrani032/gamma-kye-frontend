"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui";
import type { MyRequest, MyRequestStatus } from "@/types";

interface MyRequestsListProps {
  requests: MyRequest[];
}

const TYPE_LABEL: Record<MyRequest["type"], string> = {
  leave_request: "Leave",
  wfh_request: "WFH",
  attendance_regularization: "Regularization",
};

const STATUS_STYLES: Record<MyRequestStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-surface-tertiary text-text-muted",
};

function formatSubmitted(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Row({ req }: { req: MyRequest }) {
  const typeLabel = TYPE_LABEL[req.type];
  const leaveColor = req.type === "leave_request"
    ? (req.meta.color_code as string | undefined)
    : undefined;

  return (
    <Card className="hover:border-primary-300 transition-colors">
      <CardContent className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={leaveColor
                ? { backgroundColor: `${leaveColor}20`, color: leaveColor }
                : undefined}
            >
              {typeLabel}
            </span>
            <span className="text-sm font-medium text-text-primary truncate">
              {req.title}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_STYLES[req.status]}`}
            >
              {req.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            {req.date_range_label}
            {req.number_of_days > 0 && (
              <> · {req.number_of_days} {req.number_of_days === 1 ? "day" : "days"}</>
            )}
          </p>
          {req.subtitle && (
            <p className="mt-0.5 text-xs text-text-muted truncate">{req.subtitle}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs text-text-muted">{formatSubmitted(req.submitted_at)}</span>
          {req.workflow_instance_id && (
            <Link
              href={`/approvals/${req.workflow_instance_id}`}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              View approvers →
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function MyRequestsList({ requests }: MyRequestsListProps) {
  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center text-sm text-text-muted">
        You haven&apos;t submitted any requests yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <Row key={`${req.type}:${req.id}`} req={req} />
      ))}
    </div>
  );
}
