"use client";

import { useState } from "react";
import { Button, Input, Card, CardContent, Alert } from "@/components/ui";
import { useRegularizations } from "../hooks/use-regularizations";
import type { AttendanceRecord, RegularizationSummary } from "@/types";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-surface-tertiary text-text-muted",
};

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
}

interface RegularizationPanelProps {
  /** Attendance records that can be regularized (from monthly view) */
  attendanceRecords: AttendanceRecord[];
}

export function RegularizationPanel({ attendanceRecords }: RegularizationPanelProps) {
  const { regularizations, loading, error, formError, submit, cancel } = useRegularizations();
  const [showForm, setShowForm] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [clockIn, setClockIn] = useState("");
  const [clockOut, setClockOut] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Records eligible for regularization (have anomalies or missing data).
  // Backend blocks days marked on_leave|holiday|weekly_off|comp_off, so we exclude them here.
  const PROTECTED_STATUSES = ["on_leave", "holiday", "weekly_off", "comp_off"];
  const eligibleRecords = attendanceRecords.filter(
    (r) => !PROTECTED_STATUSES.includes(r.status) &&
      (r.is_late || r.is_early_departure || !r.clock_in || !r.clock_out || r.status === "absent")
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordId || !clockIn || !clockOut || !reason) return;
    setSubmitting(true);
    const ok = await submit({
      attendance_record_id: selectedRecordId,
      requested_clock_in: clockIn,
      requested_clock_out: clockOut,
      reason,
    });
    setSubmitting(false);
    if (ok) {
      setShowForm(false);
      setSelectedRecordId("");
      setClockIn("");
      setClockOut("");
      setReason("");
    }
  };

  const selectRecord = (record: AttendanceRecord) => {
    setSelectedRecordId(record.id);
    // Pre-fill with original times or shift defaults
    const date = record.date;
    setClockIn(record.clock_in || `${date}T09:00`);
    setClockOut(record.clock_out || `${date}T18:00`);
    setShowForm(true);
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

      {/* Submit form */}
      {showForm ? (
        <Card>
          <CardContent>
            <h4 className="text-sm font-semibold text-text-primary mb-3">Request Regularization</h4>
            {formError && <Alert variant="error" className="mb-3">{formError}</Alert>}
            <form onSubmit={handleSubmit} className="space-y-3">
              {eligibleRecords.length > 0 && !selectedRecordId && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-text-primary">Select Record</label>
                  <div className="space-y-1">
                    {eligibleRecords.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => selectRecord(r)}
                        className="w-full text-left px-3 py-2 rounded-lg border border-border hover:border-primary-300 text-sm transition-colors"
                      >
                        <span className="font-medium">{formatDate(r.date)}</span>
                        <span className="text-text-muted ml-2">
                          In: {formatTime(r.clock_in)} Out: {formatTime(r.clock_out)}
                          {r.is_late && " (Late)"}
                          {r.is_early_departure && " (Early exit)"}
                          {r.status === "absent" && " (Absent)"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {selectedRecordId && (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input label="Corrected Clock In" type="datetime-local" value={clockIn} onChange={(e) => setClockIn(e.target.value)} required />
                    <Input label="Corrected Clock Out" type="datetime-local" value={clockOut} onChange={(e) => setClockOut(e.target.value)} required />
                  </div>
                  <Input label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} required placeholder="Why does this need correction?" />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" loading={submitting}>Submit Request</Button>
                    <Button type="button" size="sm" variant="secondary" onClick={() => { setShowForm(false); setSelectedRecordId(""); }}>Cancel</Button>
                  </div>
                </>
              )}
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            {regularizations.length} regularization {regularizations.length === 1 ? "request" : "requests"}
          </p>
          {eligibleRecords.length > 0 && (
            <Button size="sm" onClick={() => setShowForm(true)}>Request Regularization</Button>
          )}
        </div>
      )}

      {/* Existing regularizations */}
      {regularizations.length > 0 && (
        <div className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
          {regularizations.map((reg) => (
            <RegularizationRow key={reg.id} reg={reg} onCancel={cancel} />
          ))}
        </div>
      )}
    </div>
  );
}

function RegularizationRow({ reg, onCancel }: { reg: RegularizationSummary; onCancel: (id: string) => Promise<boolean> }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-text-primary">{formatDate(reg.date)}</p>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_STYLES[reg.status] || ""}`}>
            {reg.status}
          </span>
        </div>
        <p className="text-xs text-text-muted mt-0.5">
          Original: {formatTime(reg.original_clock_in)} – {formatTime(reg.original_clock_out)} &rarr;
          Requested: {formatTime(reg.requested_clock_in)} – {formatTime(reg.requested_clock_out)}
        </p>
        <p className="text-xs text-text-muted">{reg.reason}</p>
      </div>
      {reg.status === "pending" && (
        <Button size="sm" variant="ghost" className="text-danger shrink-0" onClick={() => onCancel(reg.id)}>Cancel</Button>
      )}
    </div>
  );
}
