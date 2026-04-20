"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui";
import type {
  RequestEntity,
  RequestEntityStatus,
  RequestEntityType,
  UserSummary,
} from "@/types";

const TYPE_LABEL: Record<RequestEntityType, string> = {
  leave_request: "Leave",
  wfh_request: "WFH",
  attendance_regularization: "Regularization",
};

const STATUS_STYLES: Record<RequestEntityStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-surface-tertiary text-text-muted",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface RequestCardProps {
  entity: RequestEntity;
  /** Who submitted this (only shown when provided — typically on the approvals inbox). */
  requester?: UserSummary | null;
  /** Optional right-rail slot for approve/reject buttons. */
  actions?: ReactNode;
  /** Clicking the card navigates to the workflow detail if true (default). */
  linkToWorkflow?: boolean;
}

export function RequestCard({
  entity,
  requester,
  actions,
  linkToWorkflow = true,
}: RequestCardProps) {
  const typeLabel = TYPE_LABEL[entity.type];
  const leaveColor = entity.type === "leave_request"
    ? (entity.meta.color_code as string | undefined)
    : undefined;

  const body = (
    <Card className={actions ? "" : "hover:border-primary-300 transition-colors"}>
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
              {entity.title}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_STYLES[entity.status]}`}
            >
              {entity.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            {requester && (
              <>
                <span className="font-medium text-text-primary">
                  {requester.first_name} {requester.last_name}
                </span>
                {" · "}
              </>
            )}
            {entity.date_range_label}
            {entity.number_of_days > 0 && (
              <> · {entity.number_of_days} {entity.number_of_days === 1 ? "day" : "days"}</>
            )}
          </p>
          {entity.subtitle && (
            <p className="mt-0.5 text-xs text-text-muted italic truncate">{entity.subtitle}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-xs text-text-muted whitespace-nowrap">
            {formatDateTime(entity.submitted_at)}
          </span>
          {actions}
        </div>
      </CardContent>
    </Card>
  );

  if (!linkToWorkflow || !entity.workflow_instance_id) return body;
  return (
    <Link href={`/approvals/${entity.workflow_instance_id}`}>{body}</Link>
  );
}
