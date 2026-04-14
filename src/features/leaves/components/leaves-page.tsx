"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, Select, Input, Alert } from "@/components/ui";
import { useLeaves } from "../hooks/use-leaves";
import type { LeaveBalance, LeaveRequest, LeaveRequestFormData, HalfDay } from "@/types";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const HALF_DAY_OPTIONS = [
  { value: "", label: "Full Day" },
  { value: "first_half", label: "First Half" },
  { value: "second_half", label: "Second Half" },
];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-surface-tertiary text-text-muted",
};

/* ─── Balance Cards ─── */

function BalanceCards({ balances }: { balances: LeaveBalance[] }) {
  if (balances.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {balances.map((b) => (
        <Card key={b.id}>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: b.leave_type.color_code || "#6b7280" }}
              />
              <h4 className="text-sm font-medium text-text-primary truncate">{b.leave_type.name}</h4>
            </div>
            <p className="text-2xl font-bold text-text-primary">{b.balance}</p>
            <p className="text-xs text-text-muted mt-1">
              Used {b.used} of {b.entitled}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ─── Apply Leave Form ─── */

function ApplyLeaveForm({ balances, onApply, formError, fieldErrors, onClear }: {
  balances: LeaveBalance[];
  onApply: (data: LeaveRequestFormData) => Promise<boolean>;
  formError: string;
  fieldErrors: Record<string, string[]>;
  onClear: () => void;
}) {
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startHalf, setStartHalf] = useState("");
  const [endHalf, setEndHalf] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const leaveTypeOptions = [
    { value: "", label: "Select leave type" },
    ...balances.map((b) => ({ value: b.leave_type.id, label: b.leave_type.name })),
  ];

  const isSingleDay = startDate && endDate && startDate === endDate;

  const reset = () => {
    setLeaveTypeId("");
    setStartDate("");
    setEndDate("");
    setStartHalf("");
    setEndHalf("");
    setReason("");
    onClear();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveTypeId || !startDate || !endDate || !reason.trim()) return;
    setSubmitting(true);
    const payload: LeaveRequestFormData = {
      leave_type_id: leaveTypeId,
      start_date: startDate,
      end_date: endDate,
      reason: reason.trim(),
    };
    if (startHalf) payload.start_half = startHalf as HalfDay;
    if (endHalf) payload.end_half = endHalf as HalfDay;
    const ok = await onApply(payload);
    setSubmitting(false);
    if (ok) {
      reset();
      setOpen(false);
    }
  };

  const fe = (field: string) => fieldErrors[field]?.join(", ");

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>Apply Leave</Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Apply for Leave</h3>
          <Button size="sm" variant="ghost" onClick={() => { reset(); setOpen(false); }}>Cancel</Button>
        </div>
      </CardHeader>
      <CardContent>
        {formError && <Alert variant="error" className="mb-4">{formError}</Alert>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Leave Type"
              name="leave_type_id"
              value={leaveTypeId}
              onChange={(e) => setLeaveTypeId(e.target.value)}
              options={leaveTypeOptions}
              error={fe("leave_type_id")}
              required
            />
            <Input
              label="Reason"
              name="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              error={fe("reason")}
              required
              placeholder="Reason for leave"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Start Date"
              type="date"
              name="start_date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); if (!endDate) setEndDate(e.target.value); }}
              error={fe("start_date")}
              required
            />
            <Input
              label="End Date"
              type="date"
              name="end_date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              error={fe("end_date")}
              required
              min={startDate}
            />
            {isSingleDay ? (
              <Select
                label="Half Day"
                name="start_half"
                value={startHalf}
                onChange={(e) => { setStartHalf(e.target.value); setEndHalf(e.target.value); }}
                options={HALF_DAY_OPTIONS}
              />
            ) : (
              <>
                <Select
                  label="Start Half"
                  name="start_half"
                  value={startHalf}
                  onChange={(e) => setStartHalf(e.target.value)}
                  options={HALF_DAY_OPTIONS}
                />
                <Select
                  label="End Half"
                  name="end_half"
                  value={endHalf}
                  onChange={(e) => setEndHalf(e.target.value)}
                  options={HALF_DAY_OPTIONS}
                />
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="submit" loading={submitting}>Submit Request</Button>
            <Button type="button" variant="secondary" onClick={() => { reset(); setOpen(false); }}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/* ─── Request Row ─── */

function RequestRow({ request, onCancel }: {
  request: LeaveRequest;
  onCancel: (id: string, reason: string) => Promise<boolean>;
}) {
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;
    setCancelling(true);
    const ok = await onCancel(request.id, cancelReason.trim());
    setCancelling(false);
    if (ok) setShowCancel(false);
  };

  const startStr = new Date(request.start_date).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
  const endStr = new Date(request.end_date).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
  const dateRange = request.start_date === request.end_date ? startStr : `${startStr} – ${endStr}`;

  return (
    <div>
      <div className="flex items-center gap-4 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: request.leave_type.color_code || "#6b7280" }}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {request.leave_type.name}
              <span className="font-normal text-text-muted ml-2">{dateRange}</span>
            </p>
            <p className="text-xs text-text-muted truncate">{request.reason}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-text-muted">{request.number_of_days}d</span>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium capitalize ${STATUS_STYLES[request.status]}`}>
            {request.status}
          </span>
          {request.status === "pending" && (
            <Button size="sm" variant="ghost" className="text-danger" onClick={() => setShowCancel(!showCancel)}>
              Cancel
            </Button>
          )}
        </div>
      </div>
      {showCancel && (
        <div className="px-4 pb-3 flex items-center gap-2">
          <Input
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Reason for cancellation"
            className="flex-1"
          />
          <Button size="sm" variant="danger" loading={cancelling} onClick={handleCancel}>Confirm</Button>
          <Button size="sm" variant="secondary" onClick={() => { setShowCancel(false); setCancelReason(""); }}>No</Button>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─── */

export function LeavesPage() {
  const {
    balances, requests, loading, error, formError, fieldErrors,
    statusFilter, setStatusFilter, apply, cancel, clearFormErrors,
  } = useLeaves();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      {/* Leave Balances */}
      <BalanceCards balances={balances} />

      {/* Apply Leave */}
      <ApplyLeaveForm
        balances={balances}
        onApply={apply}
        formError={formError}
        fieldErrors={fieldErrors}
        onClear={clearFormErrors}
      />

      {/* Leave Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">My Leave Requests</h3>
            <Select
              name="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={STATUS_OPTIONS}
            />
          </div>
        </CardHeader>
        {requests.length > 0 ? (
          <div className="divide-y divide-border">
            {requests.map((r) => (
              <RequestRow key={r.id} request={r} onCancel={cancel} />
            ))}
          </div>
        ) : (
          <CardContent>
            <p className="text-sm text-text-muted text-center py-4">No leave requests found.</p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
