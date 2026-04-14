"use client";

import { useState, useMemo } from "react";
import { Button, Card, CardContent, CardHeader, Select, Input, Alert } from "@/components/ui";
import { useLeaves } from "../hooks/use-leaves";
import type { LeaveBalance, LeaveRequest, LeaveRequestFormData, HalfDay } from "@/types";

/* ─── Constants ─── */

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

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ─── Helpers ─── */

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
}

function computeDays(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.max(1, Math.round((e - s) / 86400000) + 1);
}

/* ─── 1. Pending Leave Requests (top section) ─── */

function PendingRequests({ requests, onCancel }: { requests: LeaveRequest[]; onCancel: (id: string, reason: string) => Promise<boolean> }) {
  const pending = requests.filter((r) => r.status === "pending");
  if (pending.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-text-primary">Pending leave requests</h2>
      {pending.map((r) => (
        <PendingRequestCard key={r.id} request={r} onCancel={onCancel} />
      ))}
    </div>
  );
}

function PendingRequestCard({ request, onCancel }: { request: LeaveRequest; onCancel: (id: string, reason: string) => Promise<boolean> }) {
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const days = computeDays(request.start_date, request.end_date);
  const dateRange = request.start_date === request.end_date
    ? formatDate(request.start_date)
    : `${formatDate(request.start_date)} - ${formatDate(request.end_date)}`;

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;
    setCancelling(true);
    const ok = await onCancel(request.id, cancelReason.trim());
    setCancelling(false);
    if (ok) setShowCancel(false);
  };

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 mt-0.5">
              <svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider">Past Leave</p>
              <p className="text-sm font-semibold text-text-primary">{dateRange} <span className="font-normal text-text-muted">({days} {days === 1 ? "day" : "days"})</span></p>
            </div>
          </div>

          <div className="flex items-start gap-8 text-sm">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider">Leave Type</p>
              <p className="font-medium text-text-primary">{request.leave_type.name}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider">Requested On</p>
              <p className="font-medium text-text-primary">{formatDate(request.created_at.slice(0, 10))}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider">Status</p>
              <p className="font-medium text-yellow-700">Pending</p>
              {request.workflow_instance_id && (
                <a href={`/approvals/${request.workflow_instance_id}`} className="text-xs text-primary-600 hover:text-primary-700">View Approvers</a>
              )}
            </div>
          </div>

          <Button size="sm" variant="ghost" className="text-danger shrink-0" onClick={() => setShowCancel(!showCancel)}>
            Cancel
          </Button>
        </div>

        {request.reason && (
          <p className="mt-2 text-xs text-text-muted pl-12">
            <span className="font-medium text-text-secondary">Leave Note:</span> {request.reason}
          </p>
        )}

        {showCancel && (
          <div className="mt-3 pl-12 flex items-center gap-2">
            <Input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Reason for cancellation" className="flex-1" />
            <Button size="sm" variant="danger" loading={cancelling} onClick={handleCancel}>Confirm</Button>
            <Button size="sm" variant="secondary" onClick={() => { setShowCancel(false); setCancelReason(""); }}>Back</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── 2. My Leave Stats (visual charts) ─── */

function LeaveStats({ requests, balances }: { requests: LeaveRequest[]; balances: LeaveBalance[] }) {
  const approved = requests.filter((r) => r.status === "approved" || r.status === "cancelled");

  // Weekly pattern: count leaves by day of week
  const weeklyPattern = useMemo(() => {
    const counts = new Array(7).fill(0);
    for (const r of approved) {
      const start = new Date(r.start_date);
      const end = new Date(r.end_date);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dow = d.getDay();
        const idx = dow === 0 ? 6 : dow - 1; // Mon=0..Sun=6
        counts[idx]++;
      }
    }
    return counts;
  }, [approved]);

  const maxWeekly = Math.max(1, ...weeklyPattern);

  // Monthly stats: count leave days per month
  const monthlyStats = useMemo(() => {
    const counts = new Array(12).fill(0);
    for (const r of approved) {
      const month = new Date(r.start_date).getMonth();
      counts[month] += parseFloat(r.number_of_days) || 0;
    }
    return counts;
  }, [approved]);

  const maxMonthly = Math.max(1, ...monthlyStats);

  // Consumed by type
  const consumedByType = useMemo(() => {
    const map = new Map<string, { name: string; color: string; days: number }>();
    for (const b of balances) {
      const used = parseFloat(b.used) || 0;
      if (used > 0) {
        map.set(b.leave_type.id, { name: b.leave_type.name, color: b.leave_type.color_code || "#6b7280", days: used });
      }
    }
    return Array.from(map.values());
  }, [balances]);

  const totalConsumed = consumedByType.reduce((sum, c) => sum + c.days, 0);

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-text-primary">My Leave Stats</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Weekly Pattern */}
        <Card>
          <CardContent className="py-4">
            <p className="text-xs font-semibold text-text-primary mb-4">Weekly Pattern</p>
            <div className="flex items-end gap-2 h-16">
              {weeklyPattern.map((count, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-sm bg-primary-500" style={{ height: `${Math.max(2, (count / maxWeekly) * 100)}%` }} />
                  <span className="text-[10px] text-text-muted">{WEEK_DAYS[i]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Consumed Leave Types */}
        <Card>
          <CardContent className="py-4">
            <p className="text-xs font-semibold text-text-primary mb-4">Consumed Leave Types</p>
            {totalConsumed > 0 ? (
              <div className="flex items-center gap-4">
                {/* Simple ring visual */}
                <div className="relative h-16 w-16 shrink-0">
                  <svg viewBox="0 0 36 36" className="h-16 w-16">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                    {consumedByType.reduce<{ elements: React.ReactNode[]; offset: number }>((acc, c) => {
                      const pct = (c.days / totalConsumed) * 87.96; // 87.96 = circumference of r=14
                      acc.elements.push(
                        <circle
                          key={c.name}
                          cx="18" cy="18" r="14" fill="none"
                          stroke={c.color} strokeWidth="4"
                          strokeDasharray={`${pct} ${87.96 - pct}`}
                          strokeDashoffset={-acc.offset}
                          transform="rotate(-90 18 18)"
                        />
                      );
                      acc.offset += pct;
                      return acc;
                    }, { elements: [], offset: 0 }).elements}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-text-primary">{totalConsumed}d</span>
                  </div>
                </div>
                <div className="space-y-1">
                  {consumedByType.map((c) => (
                    <div key={c.name} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="text-[10px] text-text-secondary">{c.name}: {c.days}d</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-text-muted text-center py-4">No leaves consumed</p>
            )}
          </CardContent>
        </Card>

        {/* Monthly Stats */}
        <Card>
          <CardContent className="py-4">
            <p className="text-xs font-semibold text-text-primary mb-4">Monthly Stats</p>
            <div className="flex items-end gap-1 h-16">
              {monthlyStats.map((count, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-sm ${count > 0 ? "bg-primary-500" : "bg-surface-tertiary"}`}
                    style={{ height: count > 0 ? `${Math.max(8, (count / maxMonthly) * 100)}%` : "2px" }}
                  />
                  <span className="text-[9px] text-text-muted">{MONTHS_SHORT[i]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ─── 3. Leave Balances (detailed cards with ring chart) ─── */

function LeaveBalanceCards({ balances }: { balances: LeaveBalance[] }) {
  if (balances.length === 0) return null;

  const primary = balances.filter((b) => parseFloat(b.entitled) > 0 || parseFloat(b.used) > 0);
  const other = balances.filter((b) => parseFloat(b.entitled) === 0 && parseFloat(b.used) === 0);

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-text-primary">Leave Balances</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {primary.map((b) => (
          <BalanceCard key={b.id} balance={b} />
        ))}
      </div>
      {other.length > 0 && (
        <p className="text-xs text-text-muted">
          <span className="font-medium text-text-secondary">Other Leave Types Available:</span>{" "}
          {other.map((b) => b.leave_type.name).join(", ")}
        </p>
      )}
    </div>
  );
}

function BalanceCard({ balance }: { balance: LeaveBalance }) {
  const available = parseFloat(balance.balance) || 0;
  const consumed = parseFloat(balance.used) || 0;
  const entitled = parseFloat(balance.entitled) || 0;
  const accrued = parseFloat(balance.accrued) || 0;
  const total = entitled || accrued || 1;
  const usedPct = Math.min(100, (consumed / total) * 100);
  const color = balance.leave_type.color_code || "#6b7280";

  // SVG ring chart
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const usedStroke = (usedPct / 100) * circumference;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">{balance.leave_type.name}</h3>
        </div>
      </CardHeader>
      <CardContent>
        {entitled > 0 || consumed > 0 ? (
          <div className="flex items-center gap-6 mb-4">
            {/* Ring chart */}
            <div className="relative shrink-0">
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r={radius} fill="none"
                  stroke={color} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${circumference - usedStroke} ${usedStroke}`}
                  strokeDashoffset={circumference / 4}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-text-primary">{available}</span>
                <span className="text-[10px] text-text-muted">Available</span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-text-secondary">Available: <strong className="text-text-primary">{available} days</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-surface-tertiary" />
                <span className="text-text-secondary">Consumed: <strong className="text-text-primary">{consumed} days</strong></span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-text-muted text-center py-6">No data to display</p>
        )}

        {/* Bottom stats */}
        <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Available</p>
            <p className="text-sm font-semibold text-text-primary">{available} {available === 1 ? "day" : "days"}</p>
          </div>
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Consumed</p>
            <p className="text-sm font-semibold text-text-primary">{consumed} {consumed === 1 ? "day" : "days"}</p>
          </div>
          {accrued > 0 && (
            <div>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Accrued so far</p>
              <p className="text-sm font-semibold text-text-primary">{accrued} days</p>
            </div>
          )}
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Annual Quota</p>
            <p className="text-sm font-semibold text-text-primary">{entitled} days</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── 4. Apply Leave Modal-style Form ─── */

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

  const reset = () => { setLeaveTypeId(""); setStartDate(""); setEndDate(""); setStartHalf(""); setEndHalf(""); setReason(""); onClear(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveTypeId || !startDate || !endDate || !reason.trim()) return;
    setSubmitting(true);
    const payload: LeaveRequestFormData = { leave_type_id: leaveTypeId, start_date: startDate, end_date: endDate, reason: reason.trim() };
    if (startHalf) payload.start_half = startHalf as HalfDay;
    if (endHalf) payload.end_half = endHalf as HalfDay;
    const ok = await onApply(payload);
    setSubmitting(false);
    if (ok) { reset(); setOpen(false); }
  };

  const fe = (field: string) => fieldErrors[field]?.join(", ");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <Card className="w-full max-w-lg mx-4 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Request Leave</h3>
            <button onClick={() => { reset(); setOpen(false); }} className="text-text-muted hover:text-text-primary">&times;</button>
          </div>
        </CardHeader>
        <CardContent>
          {formError && <Alert variant="error" className="mb-4">{formError}</Alert>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select label="Leave Type" name="leave_type_id" value={leaveTypeId} onChange={(e) => setLeaveTypeId(e.target.value)} options={leaveTypeOptions} error={fe("leave_type_id")} required />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Start Date" type="date" name="start_date" value={startDate} onChange={(e) => { setStartDate(e.target.value); if (!endDate) setEndDate(e.target.value); }} error={fe("start_date")} required />
              <Input label="End Date" type="date" name="end_date" value={endDate} onChange={(e) => setEndDate(e.target.value)} error={fe("end_date")} required min={startDate} />
            </div>
            {isSingleDay ? (
              <Select label="Half Day" name="start_half" value={startHalf} onChange={(e) => { setStartHalf(e.target.value); setEndHalf(e.target.value); }} options={HALF_DAY_OPTIONS} />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Select label="Start Half" name="start_half" value={startHalf} onChange={(e) => setStartHalf(e.target.value)} options={HALF_DAY_OPTIONS} />
                <Select label="End Half" name="end_half" value={endHalf} onChange={(e) => setEndHalf(e.target.value)} options={HALF_DAY_OPTIONS} />
              </div>
            )}
            <Input label="Leave Note" name="reason" value={reason} onChange={(e) => setReason(e.target.value)} error={fe("reason")} required placeholder="Reason for leave" />
            <div className="flex gap-2 pt-2">
              <Button type="submit" loading={submitting}>Submit Request</Button>
              <Button type="button" variant="secondary" onClick={() => { reset(); setOpen(false); }}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── 5. Leave History Table ─── */

function LeaveHistory({ requests, onCancel }: { requests: LeaveRequest[]; onCancel: (id: string, reason: string) => Promise<boolean> }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const leaveTypes = useMemo(() => {
    const types = new Map<string, string>();
    for (const r of requests) types.set(r.leave_type.id, r.leave_type.name);
    return [{ value: "", label: "All Types" }, ...Array.from(types, ([v, l]) => ({ value: v, label: l }))];
  }, [requests]);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (typeFilter && r.leave_type.id !== typeFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.leave_type.name.toLowerCase().includes(q) && !r.reason.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [requests, typeFilter, statusFilter, search]);

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-text-primary">Leave History</h2>
      <Card>
        {/* Filters */}
        <CardContent className="py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-40">
              <Select name="type_filter" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} options={leaveTypes} />
            </div>
            <div className="w-40">
              <Select name="status_filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={STATUS_OPTIONS} />
            </div>
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-48" />
            <span className="ml-auto text-xs text-text-muted">Total: {filtered.length}</span>
          </div>
        </CardContent>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border bg-surface-secondary text-left">
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Leave Dates</th>
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Leave Type</th>
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Status</th>
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Requested On</th>
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Leave Note</th>
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-muted">No leave records found.</td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <HistoryRow key={r.id} request={r} onCancel={onCancel} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function HistoryRow({ request, onCancel }: { request: LeaveRequest; onCancel: (id: string, reason: string) => Promise<boolean> }) {
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const days = parseFloat(request.number_of_days) || 1;
  const dateRange = request.start_date === request.end_date
    ? formatDate(request.start_date)
    : `${formatDate(request.start_date)} - ${formatDate(request.end_date)}`;

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;
    setCancelling(true);
    const ok = await onCancel(request.id, cancelReason.trim());
    setCancelling(false);
    if (ok) setShowCancel(false);
  };

  return (
    <>
      <tr className="hover:bg-surface-secondary/50">
        <td className="px-4 py-3">
          <p className="text-sm text-text-primary">{dateRange}</p>
          <p className="text-[10px] text-text-muted">{days} {days === 1 ? "Day" : "Days"}</p>
        </td>
        <td className="px-4 py-3">
          <p className="text-sm text-text-primary">{request.leave_type.name}</p>
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium capitalize ${STATUS_STYLES[request.status]}`}>
            {request.status}
          </span>
          {request.workflow_instance_id && request.status === "pending" && (
            <a href={`/approvals/${request.workflow_instance_id}`} className="block text-[10px] text-primary-600 hover:text-primary-700 mt-0.5">View Approvers</a>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-text-secondary">
          {formatDate(request.created_at.slice(0, 10))}
        </td>
        <td className="px-4 py-3 text-xs text-text-secondary max-w-48 truncate">
          {request.reason || "—"}
        </td>
        <td className="px-4 py-3">
          {request.status === "pending" && (
            <Button size="sm" variant="ghost" className="text-danger" onClick={() => setShowCancel(!showCancel)}>Cancel</Button>
          )}
          {request.cancellation_reason && (
            <p className="text-[10px] text-text-muted">{request.cancellation_reason}</p>
          )}
        </td>
      </tr>
      {showCancel && (
        <tr>
          <td colSpan={6} className="px-4 pb-3">
            <div className="flex items-center gap-2">
              <Input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Reason for cancellation" className="flex-1" />
              <Button size="sm" variant="danger" loading={cancelling} onClick={handleCancel}>Confirm</Button>
              <Button size="sm" variant="secondary" onClick={() => { setShowCancel(false); setCancelReason(""); }}>Back</Button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ─── Main Component ─── */

export function LeavesPage() {
  const {
    balances, requests, loading, error, formError, fieldErrors,
    apply, cancel, clearFormErrors,
  } = useLeaves();
  const [showApplyForm, setShowApplyForm] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && <Alert variant="error">{error}</Alert>}

      {/* Top bar: Request Leave button */}
      <div className="flex items-center justify-between">
        <div />
        <Button onClick={() => setShowApplyForm(true)}>Request Leave</Button>
      </div>

      {/* Apply Leave Modal */}
      {showApplyForm && (
        <ApplyLeaveFormModal
          balances={balances}
          onApply={async (data) => {
            const ok = await apply(data);
            if (ok) setShowApplyForm(false);
            return ok;
          }}
          formError={formError}
          fieldErrors={fieldErrors}
          onClear={clearFormErrors}
          onClose={() => { clearFormErrors(); setShowApplyForm(false); }}
        />
      )}

      {/* 1. Pending Requests */}
      <PendingRequests requests={requests} onCancel={cancel} />

      {/* 2. My Leave Stats */}
      <LeaveStats requests={requests} balances={balances} />

      {/* 3. Leave Balances */}
      <LeaveBalanceCards balances={balances} />

      {/* 4. Leave History */}
      <LeaveHistory requests={requests} onCancel={cancel} />
    </div>
  );
}

/* ─── Apply Leave Modal Wrapper ─── */

function ApplyLeaveFormModal({ balances, onApply, formError, fieldErrors, onClear, onClose }: {
  balances: LeaveBalance[];
  onApply: (data: LeaveRequestFormData) => Promise<boolean>;
  formError: string;
  fieldErrors: Record<string, string[]>;
  onClear: () => void;
  onClose: () => void;
}) {
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startHalf, setStartHalf] = useState("");
  const [endHalf, setEndHalf] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const leaveTypeOptions = [
    { value: "", label: "Select leave type" },
    ...balances.map((b) => ({ value: b.leave_type.id, label: b.leave_type.name })),
  ];
  const isSingleDay = startDate && endDate && startDate === endDate;
  const fe = (field: string) => fieldErrors[field]?.join(", ");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveTypeId || !startDate || !endDate || !reason.trim()) return;
    setSubmitting(true);
    const payload: LeaveRequestFormData = { leave_type_id: leaveTypeId, start_date: startDate, end_date: endDate, reason: reason.trim() };
    if (startHalf) payload.start_half = startHalf as HalfDay;
    if (endHalf) payload.end_half = endHalf as HalfDay;
    await onApply(payload);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <Card className="w-full max-w-lg mx-4 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-text-primary">Request Leave</h3>
            <button type="button" onClick={onClose} className="text-xl text-text-muted hover:text-text-primary leading-none">&times;</button>
          </div>
        </CardHeader>
        <CardContent>
          {formError && <Alert variant="error" className="mb-4">{formError}</Alert>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select label="Leave Type" name="leave_type_id" value={leaveTypeId} onChange={(e) => setLeaveTypeId(e.target.value)} options={leaveTypeOptions} error={fe("leave_type_id")} required />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Start Date" type="date" name="start_date" value={startDate} onChange={(e) => { setStartDate(e.target.value); if (!endDate) setEndDate(e.target.value); }} error={fe("start_date")} required />
              <Input label="End Date" type="date" name="end_date" value={endDate} onChange={(e) => setEndDate(e.target.value)} error={fe("end_date")} required min={startDate} />
            </div>
            {isSingleDay ? (
              <Select label="Half Day" name="start_half" value={startHalf} onChange={(e) => { setStartHalf(e.target.value); setEndHalf(e.target.value); }} options={HALF_DAY_OPTIONS} />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Select label="Start Half" name="start_half" value={startHalf} onChange={(e) => setStartHalf(e.target.value)} options={HALF_DAY_OPTIONS} />
                <Select label="End Half" name="end_half" value={endHalf} onChange={(e) => setEndHalf(e.target.value)} options={HALF_DAY_OPTIONS} />
              </div>
            )}
            <Input label="Leave Note" name="reason" value={reason} onChange={(e) => setReason(e.target.value)} error={fe("reason")} required placeholder="Reason for leave" />
            <div className="flex gap-2 pt-2">
              <Button type="submit" loading={submitting}>Submit Request</Button>
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
