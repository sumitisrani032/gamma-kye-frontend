"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { cancelLeaveRequest } from "@/services/leave-request-service";
import { cancelWfh } from "@/services/wfh-request-service";
import { cancelRegularization } from "@/services/regularization-service";
import { invalidateRequests } from "@/lib/invalidate";
import { RequestCard } from "./request-card";
import type { RequestEntity } from "@/types";

interface MyRequestsListProps {
  requests: RequestEntity[];
  /** Called after a successful inline cancel so the parent list refetches. */
  onRefresh?: () => Promise<void> | void;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Rules for when the user can cancel their own request:
 *   - pending   → always
 *   - approved  → only leaves with start_date in the future (balance is refunded)
 *   - rejected / cancelled → never
 */
function canCancel(req: RequestEntity): boolean {
  if (req.status === "pending") return true;
  if (req.status === "approved" && req.type === "leave_request") {
    return req.start_date > todayISO();
  }
  return false;
}

async function runCancel(req: RequestEntity, reason: string): Promise<void> {
  if (req.type === "leave_request") {
    await cancelLeaveRequest(req.id, reason);
  } else if (req.type === "wfh_request") {
    await cancelWfh(req.id);
  } else {
    await cancelRegularization(req.id);
  }
  // Broadcast so other open views (calendar, balances, attendance) catch up.
  invalidateRequests([
    "my_requests",
    "calendar",
    "attendance",
    "leave_balances",
    "wfh",
    "workflow_instances",
  ]);
}

function InlineCancel({ req, onRefresh }: { req: RequestEntity; onRefresh?: () => Promise<void> | void }) {
  const needsReason = req.type === "leave_request";
  const showWarning = req.status === "approved" && req.type === "leave_request";
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    if (needsReason && !reason.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await runCancel(req, reason.trim());
      // Fire a direct refresh so the list reflects the new status immediately,
      // regardless of whether the invalidate event subscriber is mounted.
      if (onRefresh) await onRefresh();
      setOpen(false);
    } catch (err) {
      const apiError = err as { error?: string };
      setError(apiError.error || "Cancellation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <Button
        size="sm"
        variant="ghost"
        className="text-danger"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
      >
        Cancel
      </Button>
    );
  }

  return (
    <div
      className="flex flex-col gap-1.5 min-w-[260px]"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      {showWarning && (
        <p className="text-[10px] text-text-secondary">
          Cancelling this approved leave will refund your balance.
        </p>
      )}
      {needsReason && (
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for cancellation"
        />
      )}
      {error && <p className="text-[10px] text-danger">{error}</p>}
      <div className="flex items-center gap-1.5 justify-end">
        <Button size="sm" variant="danger" loading={submitting} onClick={handle}>Confirm</Button>
        <Button size="sm" variant="secondary" onClick={() => { setOpen(false); setReason(""); }}>Back</Button>
      </div>
    </div>
  );
}

export function MyRequestsList({ requests, onRefresh }: MyRequestsListProps) {
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
        <RequestCard
          key={`${req.type}:${req.id}`}
          entity={req}
          actions={canCancel(req) ? <InlineCancel req={req} onRefresh={onRefresh} /> : undefined}
        />
      ))}
    </div>
  );
}
