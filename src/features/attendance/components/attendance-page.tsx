"use client";

import { useState, useCallback, useEffect } from "react";
import { Button, Card, CardContent, CardHeader, Input, Alert } from "@/components/ui";
import { useAttendance } from "../hooks/use-attendance";
import { useRegularizations } from "../hooks/use-regularizations";
import type { AttendanceRecord, AttendanceSummary, RegularizationSummary, Shift } from "@/types";

/* ─── Constants ─── */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEK_DAYS = ["M", "T", "W", "T", "F", "S", "S"];

const STATUS_STYLES: Record<string, string> = {
  present: "bg-green-100 text-green-700",
  absent: "bg-red-100 text-red-700",
  half_day: "bg-yellow-100 text-yellow-700",
  on_leave: "bg-blue-100 text-blue-700",
  holiday: "bg-purple-100 text-purple-700",
  weekly_off: "bg-surface-tertiary text-text-muted",
};

const REG_STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-surface-tertiary text-text-muted",
};

type LogTab = "log" | "requests";

/* ─── Helpers ─── */

function formatTime(iso: string | null, use24h: boolean): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit", minute: "2-digit", hour12: !use24h,
  });
}

function formatHours(h: string | null): string {
  if (!h) return "—";
  const num = parseFloat(h);
  const hrs = Math.floor(num);
  const mins = Math.round((num - hrs) * 60);
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h 0m`;
}

function getWeekDayIndex(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1; // Mon=0 ... Sun=6
}

function parseShiftHours(shift: Shift | null): number {
  if (!shift) return 9;
  return parseFloat(shift.full_day_hours) || 9;
}

function formatShiftTime(time: string, use24h: boolean): string {
  const [h, m] = time.split(":").map(Number);
  if (use24h) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function computeShiftProgress(clockIn: string | null, clockOut: string | null, shiftHours: number): number {
  if (!clockIn) return 0;
  const start = new Date(clockIn).getTime();
  const end = clockOut ? new Date(clockOut).getTime() : Date.now();
  const duration = (end - start) / 3600000;
  return Math.min(100, Math.round((duration / shiftHours) * 100));
}

function isWeeklyOff(shift: Shift | null): boolean {
  if (!shift) return false;
  const dayNames: string[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const today = dayNames[new Date().getDay()];
  return shift.weekly_offs.includes(today as any);
}

function getAvgHours(records: AttendanceRecord[]): string {
  const working = records.filter((r) => r.status === "present" || r.status === "half_day");
  if (working.length === 0) return "0h 0m";
  const total = working.reduce((acc, r) => acc + (parseFloat(r.total_hours || "0")), 0);
  const avg = total / working.length;
  const hrs = Math.floor(avg);
  const mins = Math.round((avg - hrs) * 60);
  return `${hrs}h ${mins}m`;
}

function getOnTimePercent(records: AttendanceRecord[]): number {
  const working = records.filter((r) => r.status === "present" || r.status === "half_day");
  if (working.length === 0) return 0;
  const onTime = working.filter((r) => !r.is_late).length;
  return Math.round((onTime / working.length) * 100);
}

/* ─── Live Clock ─── */

function LiveClock({ use24h }: { use24h: boolean }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-center">
      <p className="text-3xl font-bold text-text-primary font-mono tabular-nums">
        {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: !use24h })}
      </p>
      <p className="text-xs text-text-muted mt-1">
        {time.toLocaleDateString([], { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
      </p>
    </div>
  );
}

/* ─── Attendance Stats Card ─── */

function StatsCard({ records, summary }: { records: AttendanceRecord[]; summary: AttendanceSummary | null }) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-text-primary">Attendance Stats</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-100">
              <span className="text-xs font-bold text-yellow-700">Me</span>
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">{getAvgHours(records)}</p>
              <p className="text-[10px] text-text-muted">Avg hrs / day</p>
            </div>
            <div className="ml-4">
              <p className="text-sm font-bold text-text-primary">{getOnTimePercent(records)}%</p>
              <p className="text-[10px] text-text-muted">On time arrival</p>
            </div>
          </div>
        </div>
        {summary && (
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border">
            {[
              { label: "Present", value: summary.days_present, color: "text-green-600" },
              { label: "Absent", value: summary.days_absent, color: "text-red-600" },
              { label: "On Leave", value: summary.days_on_leave, color: "text-blue-600" },
              { label: "Late", value: summary.late_count, color: "text-yellow-600" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Timings Card ─── */

function TimingsCard({ today, shift, use24h }: { today: AttendanceRecord | null; shift: Shift | null; use24h: boolean }) {
  const todayIdx = getWeekDayIndex();
  const shiftHours = parseShiftHours(shift);
  const progress = computeShiftProgress(today?.clock_in ?? null, today?.clock_out ?? null, shiftHours);
  const weeklyOff = isWeeklyOff(shift);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Timings</h3>
          {shift && <span className="text-[10px] text-text-muted">{shift.name}</span>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Week dots — highlight weekly offs */}
        <div className="flex items-center gap-2">
          {WEEK_DAYS.map((d, i) => {
            const fullDayNames = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
            const isOff = shift?.weekly_offs.includes(fullDayNames[i] as any);
            return (
              <div
                key={i}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                  i === todayIdx
                    ? "bg-primary-600 text-white"
                    : isOff
                      ? "bg-surface-tertiary text-text-muted line-through"
                      : "bg-surface-tertiary text-text-secondary"
                }`}
              >
                {d}
              </div>
            );
          })}
        </div>

        {/* Shift schedule */}
        {shift && (
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>Shift: {formatShiftTime(shift.start_time, use24h)} – {formatShiftTime(shift.end_time, use24h)}</span>
            <span>{shiftHours}h / day</span>
          </div>
        )}

        {/* Today's progress */}
        {weeklyOff ? (
          <p className="text-xs text-text-muted">Weekly off today</p>
        ) : today?.clock_in ? (
          <div>
            <p className="text-xs text-text-secondary mb-2">
              Today ({formatTime(today.clock_in, use24h)} – {today.clock_out ? formatTime(today.clock_out, use24h) : "In Progress"})
            </p>
            <div className="h-3 rounded-full bg-surface-tertiary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-text-muted">
                Duration: {formatHours(today.total_hours)}
              </span>
              {shift && (
                <span className="text-[10px] text-text-muted">
                  Grace: {shift.grace_minutes}m
                </span>
              )}
              {today.overtime_minutes > 0 && (
                <span className="text-[10px] text-green-600">
                  +{today.overtime_minutes}m OT
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-text-muted">Not clocked in yet today</p>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Actions Card ─── */

function ActionsCard({
  today, isClockedIn, clocking, use24h, onClockIn, onClockOut, onToggle24h,
}: {
  today: AttendanceRecord | null;
  isClockedIn: boolean;
  clocking: boolean;
  use24h: boolean;
  onClockIn: () => void;
  onClockOut: () => void;
  onToggle24h: () => void;
}) {
  const dayComplete = !!today?.clock_in && !!today?.clock_out;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-text-primary">Actions</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <LiveClock use24h={use24h} />

        <div className="flex flex-col gap-2">
          {!today || !today.clock_in ? (
            <Button onClick={onClockIn} loading={clocking} className="w-full">Clock In</Button>
          ) : isClockedIn ? (
            <Button onClick={onClockOut} loading={clocking} variant="secondary" className="w-full">Clock Out</Button>
          ) : (
            <span className="inline-flex items-center justify-center rounded-lg bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
              Day Complete
            </span>
          )}
        </div>

        <label className="flex items-center justify-between text-xs text-text-secondary cursor-pointer">
          <span>24 hour format</span>
          <input type="checkbox" checked={use24h} onChange={onToggle24h} className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500" />
        </label>
      </CardContent>
    </Card>
  );
}

/* ─── Inline Regularization Form ─── */

function RegularizeForm({ record, onSubmit, onCancel }: {
  record: AttendanceRecord;
  onSubmit: (data: { attendance_record_id: string; requested_clock_in: string; requested_clock_out: string; reason: string }) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [clockIn, setClockIn] = useState(record.clock_in ? record.clock_in.slice(0, 16) : `${record.date}T09:00`);
  const [clockOut, setClockOut] = useState(record.clock_out ? record.clock_out.slice(0, 16) : `${record.date}T18:00`);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmitting(true);
    const ok = await onSubmit({ attendance_record_id: record.id, requested_clock_in: clockIn, requested_clock_out: clockOut, reason });
    setSubmitting(false);
    if (ok) onCancel();
  };

  return (
    <tr>
      <td colSpan={5} className="px-4 pb-4 pt-0">
        <form onSubmit={handle} className="space-y-3 bg-surface-secondary rounded-lg p-4">
          <p className="text-xs text-text-muted">Correct attendance for {new Date(record.date).toLocaleDateString([], { day: "2-digit", month: "short" })}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input label="Corrected In" type="datetime-local" value={clockIn} onChange={(e) => setClockIn(e.target.value)} required />
            <Input label="Corrected Out" type="datetime-local" value={clockOut} onChange={(e) => setClockOut(e.target.value)} required />
            <Input label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} required placeholder="Why?" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={submitting}>Submit</Button>
            <Button type="button" size="sm" variant="secondary" onClick={onCancel}>Cancel</Button>
          </div>
        </form>
      </td>
    </tr>
  );
}

/* ─── Attendance Visual Bar (with shift window) ─── */

function parseHM(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h + m / 60;
}

function AttendanceVisual({ record, shift, use24h }: { record: AttendanceRecord; shift: Shift | null; use24h: boolean }) {
  const [hover, setHover] = useState(false);

  if (record.status === "weekly_off" || record.status === "holiday" || record.status === "on_leave") {
    return null;
  }
  if (!record.clock_in) return null;

  // Dynamic range: 2h before shift start to 2h after shift end (or fallback 7-21)
  const shiftStart = shift ? parseHM(shift.start_time) : 9;
  const shiftEnd = shift ? parseHM(shift.end_time) : 18;
  const rangeStart = Math.floor(Math.max(0, shiftStart - 2));
  const rangeEnd = Math.ceil(Math.min(24, shiftEnd + 2));
  const rangeHours = rangeEnd - rangeStart;
  const toPct = (h: number) => Math.max(0, Math.min(100, ((h - rangeStart) / rangeHours) * 100));

  const inHour = new Date(record.clock_in).getHours() + new Date(record.clock_in).getMinutes() / 60;
  const outHour = record.clock_out
    ? new Date(record.clock_out).getHours() + new Date(record.clock_out).getMinutes() / 60
    : new Date().getHours() + new Date().getMinutes() / 60;

  // Generate tick marks for every hour in range
  const ticks: number[] = [];
  for (let h = rangeStart; h <= rangeEnd; h++) ticks.push(h);

  return (
    <div className="relative" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="relative h-4 w-full cursor-pointer">
        {/* Tick marks — small vertical dashes */}
        {ticks.map((h) => (
          <div key={h} className="absolute top-0 h-full flex flex-col items-center" style={{ left: `${toPct(h)}%` }}>
            <div className={`w-px ${h === shiftStart || h === shiftEnd ? "h-full bg-text-muted" : "h-1/2 bg-border"}`} />
          </div>
        ))}

        {/* Shift window marker — small triangle at bottom for start/end */}
        <div className="absolute bottom-0 w-0 h-0 border-l-[3px] border-r-[3px] border-b-[4px] border-transparent border-b-text-muted" style={{ left: `${toPct(shiftStart)}%`, transform: "translateX(-3px)" }} />
        <div className="absolute bottom-0 w-0 h-0 border-l-[3px] border-r-[3px] border-b-[4px] border-transparent border-b-text-muted" style={{ left: `${toPct(shiftEnd)}%`, transform: "translateX(-3px)" }} />

        {/* Filled work bar */}
        <div
          className="absolute top-0.5 bottom-0.5 rounded-full bg-primary-500"
          style={{ left: `${toPct(inHour)}%`, width: `${Math.max(0.5, toPct(outHour) - toPct(inHour))}%` }}
        />
      </div>

      {/* Hover tooltip */}
      {hover && (
        <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-1.5 rounded-lg border border-border bg-surface shadow-lg px-3 py-2 text-xs whitespace-nowrap">
          <div className="flex items-center gap-3">
            <span>In: <strong className="text-green-600">{formatTime(record.clock_in, use24h)}</strong></span>
            <span>Out: <strong className={record.clock_out ? "text-red-500" : "text-text-muted"}>{record.clock_out ? formatTime(record.clock_out, use24h) : "In Progress"}</strong></span>
            {record.total_hours && <span>Duration: <strong>{formatHours(record.total_hours)}</strong></span>}
          </div>
          {shift && <p className="text-text-muted mt-0.5">Shift: {shift.start_time} – {shift.end_time}</p>}
          {record.is_late && <p className="text-yellow-600 mt-0.5">{record.late_minutes}m late</p>}
        </div>
      )}
    </div>
  );
}

/* ─── Attendance Log Table ─── */

function AttendanceLog({
  records, regularizations, use24h, regularizingId, shift,
  onRegularize, onSubmitReg, onCancelReg, onCancelRequest,
}: {
  records: AttendanceRecord[];
  regularizations: RegularizationSummary[];
  use24h: boolean;
  regularizingId: string | null;
  shift: Shift | null;
  onRegularize: (id: string) => void;
  onSubmitReg: (data: { attendance_record_id: string; requested_clock_in: string; requested_clock_out: string; reason: string }) => Promise<boolean>;
  onCancelReg: () => void;
  onCancelRequest: (id: string) => Promise<boolean>;
}) {
  const regByDate = new Map<string, RegularizationSummary>();
  for (const r of regularizations) regByDate.set(r.date, r);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted w-36">Date</th>
            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Attendance Visual</th>
            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted w-28">Gross Hours</th>
            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted w-40">Arrival</th>
            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted w-32 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {records.map((r) => {
            const date = new Date(r.date);
            const dayName = date.toLocaleDateString([], { weekday: "short" });
            const dateStr = date.toLocaleDateString([], { day: "2-digit", month: "short" });
            const isOff = r.status === "weekly_off" || r.status === "holiday";
            const isLeave = r.status === "on_leave";
            const reg = regByDate.get(r.date);
            const hasAnomaly = r.is_late || r.is_early_departure || r.status === "absent" || !r.clock_in || !r.clock_out;
            const canRegularize = hasAnomaly && !r.is_regularized && (!reg || reg.status === "cancelled" || reg.status === "rejected");
            const isFormOpen = regularizingId === r.id;

            return (
              <React.Fragment key={r.id}>
                <tr className={isOff || isLeave ? "bg-surface-secondary" : "hover:bg-surface-secondary/50"}>
                  {/* Date */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-primary font-medium">{dayName}, {dateStr}</span>
                      {isOff && (
                        <span className="inline-flex items-center rounded bg-surface-tertiary px-1.5 py-0.5 text-[9px] font-bold text-text-muted uppercase">
                          {r.status === "weekly_off" ? "W-OFF" : "Holiday"}
                        </span>
                      )}
                      {isLeave && (
                        <span className="inline-flex items-center rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 uppercase">
                          Leave
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Visual */}
                  <td className="px-4 py-3">
                    {isOff || isLeave ? (
                      <span className="text-xs text-text-muted">
                        {isOff ? `Full day ${r.status === "weekly_off" ? "Weekly-off" : "Holiday"}` : "On Leave"}
                      </span>
                    ) : (
                      <AttendanceVisual record={r} shift={shift} use24h={use24h} />
                    )}
                  </td>

                  {/* Gross Hours */}
                  <td className="px-4 py-3">
                    {!isOff && !isLeave && (
                      <span className="text-sm text-text-primary">{formatHours(r.total_hours)}</span>
                    )}
                  </td>

                  {/* Arrival */}
                  <td className="px-4 py-3">
                    {!isOff && !isLeave && r.clock_in && (
                      <div className="flex items-center gap-2">
                        {r.is_late ? (
                          <>
                            <span className="text-yellow-600">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                              </svg>
                            </span>
                            <span className="text-xs text-yellow-700">{r.late_minutes}m late</span>
                          </>
                        ) : (
                          <>
                            <span className="text-green-600">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                              </svg>
                            </span>
                            <span className="text-xs text-green-700">On Time</span>
                          </>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {reg && (reg.status === "pending" || reg.status === "approved") ? (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${REG_STATUS_STYLES[reg.status]}`}>
                          Reg: {reg.status}
                          {reg.status === "pending" && (
                            <button type="button" onClick={() => onCancelRequest(reg.id)} className="ml-1 text-text-muted hover:text-danger">&times;</button>
                          )}
                        </span>
                      ) : canRegularize ? (
                        <Button size="sm" variant="ghost" onClick={() => onRegularize(r.id)}>
                          Regularize
                        </Button>
                      ) : null}
                      {r.is_regularized && (
                        <span className="inline-flex items-center rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-600">
                          Regularized
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
                {isFormOpen && (
                  <RegularizeForm record={r} onSubmit={onSubmitReg} onCancel={onCancelReg} />
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Regularization Requests Tab ─── */

function RegularizationRequests({ regularizations, onCancel, use24h }: {
  regularizations: RegularizationSummary[];
  onCancel: (id: string) => Promise<boolean>;
  use24h: boolean;
}) {
  if (regularizations.length === 0) {
    return <p className="text-sm text-text-muted text-center py-8">No regularization requests.</p>;
  }

  return (
    <div className="divide-y divide-border">
      {regularizations.map((r) => {
        const dateStr = new Date(r.date).toLocaleDateString([], { weekday: "short", day: "2-digit", month: "short" });
        return (
          <div key={r.id} className="flex items-center justify-between px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-text-primary">{dateStr}</p>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${REG_STATUS_STYLES[r.status]}`}>
                  {r.status}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {formatTime(r.original_clock_in, use24h)} – {formatTime(r.original_clock_out, use24h)}
                {" → "}
                {formatTime(r.requested_clock_in, use24h)} – {formatTime(r.requested_clock_out, use24h)}
              </p>
              <p className="text-xs text-text-muted">{r.reason}</p>
            </div>
            {r.status === "pending" && (
              <Button size="sm" variant="ghost" className="text-danger shrink-0" onClick={() => onCancel(r.id)}>Cancel</Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Month Selector Pills ─── */

function MonthPills({ year, month, onSelect }: {
  year: number; month: number;
  onSelect: (y: number, m: number) => void;
}) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Generate last 6 months
  const pills: { y: number; m: number; label: string }[] = [];
  for (let i = 0; i < 7; i++) {
    let pm = currentMonth - i;
    let py = currentYear;
    if (pm <= 0) { pm += 12; py -= 1; }
    pills.push({ y: py, m: pm, label: MONTHS[pm - 1] });
  }

  return (
    <div className="flex items-center gap-1">
      {pills.map((p) => (
        <button
          key={`${p.y}-${p.m}`}
          type="button"
          onClick={() => onSelect(p.y, p.m)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            year === p.y && month === p.m
              ? "bg-primary-600 text-white"
              : "text-text-secondary hover:bg-surface-tertiary"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Main Component ─── */

// Need React for Fragment
import React from "react";

export function AttendancePage() {
  const {
    today, records, summary, shift, loading, clocking, error,
    year, month, setYear, setMonth,
    handleClockIn, handleClockOut, isClockedIn,
  } = useAttendance();
  const reg = useRegularizations();
  const [regularizingId, setRegularizingId] = useState<string | null>(null);
  const [use24h, setUse24h] = useState(false);
  const [logTab, setLogTab] = useState<LogTab>("log");

  const handleSubmitReg = useCallback(async (data: { attendance_record_id: string; requested_clock_in: string; requested_clock_out: string; reason: string }) => {
    const ok = await reg.submit(data);
    if (ok) setRegularizingId(null);
    return ok;
  }, [reg]);

  const handleMonthSelect = useCallback((y: number, m: number) => {
    setYear(y);
    setMonth(m);
  }, [setYear, setMonth]);

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
      {reg.formError && <Alert variant="error">{reg.formError}</Alert>}

      {/* Top Row: Stats | Timings | Actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatsCard records={records} summary={summary} />
        <TimingsCard today={today} shift={shift} use24h={use24h} />
        <ActionsCard
          today={today}
          isClockedIn={isClockedIn}
          clocking={clocking}
          use24h={use24h}
          onClockIn={handleClockIn}
          onClockOut={handleClockOut}
          onToggle24h={() => setUse24h((p) => !p)}
        />
      </div>

      {/* Logs & Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1">
              <h3 className="text-sm font-semibold text-text-primary mr-4">Logs & Requests</h3>
              {(["log", "requests"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setLogTab(t)}
                  className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                    logTab === t
                      ? "border-primary-600 text-primary-700"
                      : "border-transparent text-text-muted hover:text-text-primary"
                  }`}
                >
                  {t === "log" ? "Attendance Log" : "Attendance Requests"}
                </button>
              ))}
            </div>
            <MonthPills year={year} month={month} onSelect={handleMonthSelect} />
          </div>
        </CardHeader>

        {logTab === "log" ? (
          records.length > 0 ? (
            <AttendanceLog
              records={records}
              regularizations={reg.regularizations}
              use24h={use24h}
              regularizingId={regularizingId}
              shift={shift}
              onRegularize={setRegularizingId}
              onSubmitReg={handleSubmitReg}
              onCancelReg={() => setRegularizingId(null)}
              onCancelRequest={reg.cancel}
            />
          ) : (
            <CardContent>
              <p className="text-sm text-text-muted text-center py-8">No attendance records for this period.</p>
            </CardContent>
          )
        ) : (
          <RegularizationRequests regularizations={reg.regularizations} onCancel={reg.cancel} use24h={use24h} />
        )}
      </Card>
    </div>
  );
}
