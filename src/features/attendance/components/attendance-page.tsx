"use client";

import { useState, useCallback, useEffect } from "react";
import { Button, Card, CardContent, CardHeader, Input, Alert } from "@/components/ui";
import { useAttendance } from "../hooks/use-attendance";
import { useRegularizations } from "../hooks/use-regularizations";
import { requestWfh, listWfhRequests, cancelWfh, type WfhRequest } from "@/services/wfh-request-service";
import type { AttendanceRecord, AttendanceState, AttendanceSummary, AttendanceWorkMode, AttendanceWorkModeSource, RegularizationSummary, Shift, ApiError } from "@/types";

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
  comp_off: "bg-surface-tertiary text-text-muted",
};

const REG_STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-surface-tertiary text-text-muted",
};

function WorkModeBadge({ mode, source }: { mode: AttendanceWorkMode; source?: AttendanceWorkModeSource }) {
  const isWfh = mode === "wfh";
  const sourceLabel = source === "request" ? "requested" : source === "manual" ? "manual" : "auto";
  return (
    <span
      title={`${isWfh ? "Work from home" : "Office"} (${sourceLabel})`}
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
        isWfh ? "bg-teal-100 text-teal-700" : "bg-surface-tertiary text-text-muted"
      }`}
    >
      <span aria-hidden>{isWfh ? "🏠" : "🏢"}</span>
      {isWfh ? "WFH" : "Office"}
    </span>
  );
}

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
                Effective: {formatHours(today.effective_hours || today.total_hours)}
                {today.effective_hours && today.total_hours && today.effective_hours !== today.total_hours && (
                  <span className="text-text-muted ml-1">(Gross: {formatHours(today.total_hours)})</span>
                )}
              </span>
              {today.sessions_count && today.sessions_count > 1 && (
                <span className="text-[10px] text-primary-600">{today.sessions_count} sessions</span>
              )}
              {today.overtime_minutes > 0 && (
                <span className="text-[10px] text-green-600">+{today.overtime_minutes}m OT</span>
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

/* ─── Actions Card (state-based) ─── */

function ActionsCard({
  state, today, clocking, use24h, onClockIn, onClockOut, onToggle24h,
}: {
  state: AttendanceState;
  today: AttendanceRecord | null;
  clocking: boolean;
  use24h: boolean;
  onClockIn: () => void;
  onClockOut: () => void;
  onToggle24h: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-text-primary">Actions</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <LiveClock use24h={use24h} />

        <div className="flex flex-col gap-2">
          {state === "not_started" && (
            <Button onClick={onClockIn} loading={clocking} className="w-full">Clock In</Button>
          )}
          {state === "working" && (
            <Button onClick={onClockOut} loading={clocking} variant="secondary" className="w-full">Clock Out</Button>
          )}
          {state === "on_break" && (
            <>
              <Button onClick={onClockIn} loading={clocking} className="w-full">Resume Work</Button>
              <p className="text-xs text-text-muted text-center">On break · {today?.sessions_count || 0} session{(today?.sessions_count || 0) !== 1 ? "s" : ""} today</p>
            </>
          )}
        </div>

        {/* Session info */}
        {today && today.sessions && today.sessions.length > 0 && (
          <div className="border-t border-border pt-3 space-y-1.5">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Sessions</p>
            {today.sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">
                  S{s.session_number}: {formatTime(s.clock_in, use24h)} – {s.clock_out ? formatTime(s.clock_out, use24h) : <span className="text-green-600">Active</span>}
                </span>
                {s.hours != null && <span className="text-text-muted">{Number(s.hours).toFixed(1)}h</span>}
              </div>
            ))}
            {today.effective_hours && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
                <span className="text-text-secondary font-medium">Effective</span>
                <span className="font-bold text-primary-600">{Number(today.effective_hours).toFixed(1)}h</span>
              </div>
            )}
          </div>
        )}

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

  if (record.status === "weekly_off" || record.status === "holiday" || record.status === "on_leave" || record.status === "comp_off") {
    return null;
  }

  // Absent / no clock-in — show empty bar with red absent marker
  if (!record.clock_in) {
    const shiftStartH = shift ? parseHM(shift.start_time) : 9;
    const shiftEndH = shift ? parseHM(shift.end_time) : 18;
    const rangeStart = 6;
    const rangeEnd = 23;
    const toPct = (h: number) => Math.max(0, Math.min(100, ((h - rangeStart) / (rangeEnd - rangeStart)) * 100));
    const ticks: number[] = [];
    for (let h = rangeStart; h <= rangeEnd; h++) ticks.push(h);

    return (
      <div className="relative max-w-64">
        <div className="relative h-2 w-full cursor-default">
          {ticks.map((h) => (<div key={h} className="absolute top-0 h-full w-px bg-border" style={{ left: `${toPct(h)}%` }} />))}
          <div className="absolute top-0 h-full bg-surface-tertiary" style={{ left: `${toPct(shiftStartH)}%`, width: `${toPct(shiftEndH) - toPct(shiftStartH)}%` }} />
          {/* Red dashed line for absent shift window */}
          <div className="absolute top-0 h-full rounded-full bg-red-200 border border-dashed border-red-300" style={{ left: `${toPct(shiftStartH)}%`, width: `${toPct(shiftEndH) - toPct(shiftStartH)}%` }} />
        </div>
      </div>
    );
  }

  // Fixed range: show full day 6AM–11PM with hourly ticks like Keka
  const rangeStart = 6;
  const rangeEnd = 23;
  const toPct = (h: number) => Math.max(0, Math.min(100, ((h - rangeStart) / (rangeEnd - rangeStart)) * 100));

  const inHour = new Date(record.clock_in).getHours() + new Date(record.clock_in).getMinutes() / 60;
  const outHour = record.clock_out
    ? new Date(record.clock_out).getHours() + new Date(record.clock_out).getMinutes() / 60
    : new Date().getHours() + new Date().getMinutes() / 60;

  const shiftStartH = shift ? parseHM(shift.start_time) : null;
  const shiftEndH = shift ? parseHM(shift.end_time) : null;

  // Hourly ticks
  const ticks: number[] = [];
  for (let h = rangeStart; h <= rangeEnd; h++) ticks.push(h);

  return (
    <div className="relative max-w-64" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="relative h-2 w-full cursor-pointer">
        {/* Grey track with tick marks */}
        {ticks.map((h) => (
          <div key={h} className="absolute top-0 h-full w-px bg-border" style={{ left: `${toPct(h)}%` }} />
        ))}

        {/* Shift window — subtle grey background */}
        {shiftStartH != null && shiftEndH != null && (
          <div
            className="absolute top-0 h-full bg-surface-tertiary"
            style={{ left: `${toPct(shiftStartH)}%`, width: `${toPct(shiftEndH) - toPct(shiftStartH)}%` }}
          />
        )}

        {/* Shift boundary markers — small triangles */}
        {shiftStartH != null && (
          <div className="absolute -bottom-1 w-0 h-0 border-l-[2.5px] border-r-[2.5px] border-b-[3px] border-transparent border-b-text-muted" style={{ left: `${toPct(shiftStartH)}%`, transform: "translateX(-2.5px)" }} />
        )}
        {shiftEndH != null && (
          <div className="absolute -bottom-1 w-0 h-0 border-l-[2.5px] border-r-[2.5px] border-b-[3px] border-transparent border-b-text-muted" style={{ left: `${toPct(shiftEndH)}%`, transform: "translateX(-2.5px)" }} />
        )}

        {/* Filled work bars — one per session, or single bar if no sessions */}
        {record.sessions && record.sessions.length > 0 ? (
          record.sessions.map((s) => {
            const sIn = new Date(s.clock_in).getHours() + new Date(s.clock_in).getMinutes() / 60;
            const sOut = s.clock_out
              ? new Date(s.clock_out).getHours() + new Date(s.clock_out).getMinutes() / 60
              : new Date().getHours() + new Date().getMinutes() / 60;
            return (
              <div key={s.id} className="absolute top-0 h-full rounded-full bg-primary-500" style={{ left: `${toPct(sIn)}%`, width: `${Math.max(0.8, toPct(sOut) - toPct(sIn))}%` }} />
            );
          })
        ) : (
          <div className="absolute top-0 h-full rounded-full bg-primary-500" style={{ left: `${toPct(inHour)}%`, width: `${Math.max(0.8, toPct(outHour) - toPct(inHour))}%` }} />
        )}
      </div>

      {/* Hover tooltip */}
      {hover && (
        <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 rounded-lg border border-border bg-surface shadow-lg px-3 py-2 text-xs whitespace-nowrap">
          {record.sessions && record.sessions.length > 1 ? (
            <div className="space-y-1">
              {record.sessions.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="text-text-muted">S{s.session_number}:</span>
                  <span className="text-green-600">{formatTime(s.clock_in, use24h)}</span>
                  <span className="text-text-muted">–</span>
                  <span className={s.clock_out ? "text-red-500" : "text-text-muted"}>{s.clock_out ? formatTime(s.clock_out, use24h) : "Active"}</span>
                  {s.hours != null && <span className="text-text-muted">({Number(s.hours).toFixed(1)}h)</span>}
                </div>
              ))}
              <div className="flex items-center gap-2 pt-1 border-t border-border">
                <span className="text-text-secondary font-medium">Effective: <strong className="text-primary-600">{formatHours(record.effective_hours || record.total_hours)}</strong></span>
                {record.total_hours && record.effective_hours && record.total_hours !== record.effective_hours && (
                  <span className="text-text-muted">Gross: {formatHours(record.total_hours)}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span>In: <strong className="text-green-600">{formatTime(record.clock_in, use24h)}</strong></span>
              <span>Out: <strong className={record.clock_out ? "text-red-500" : "text-text-muted"}>{record.clock_out ? formatTime(record.clock_out, use24h) : "In Progress"}</strong></span>
              {record.effective_hours && <span>Duration: <strong>{formatHours(record.effective_hours)}</strong></span>}
            </div>
          )}
          {shift && <p className="text-text-muted mt-0.5">Shift: {shift.start_time} – {shift.end_time}</p>}
          {record.is_late && <p className="text-yellow-600 mt-0.5">{record.late_minutes}m late</p>}
        </div>
      )}
    </div>
  );
}

/* ─── Log Status Icon (action column) ─── */

function LogStatusIcon({ record, shift, regularization, wfhForDate, onRegularize, onCancelRequest, onApplyWfh }: {
  record: AttendanceRecord;
  shift: Shift | null;
  regularization?: RegularizationSummary;
  wfhForDate?: WfhRequest;
  onRegularize: () => void;
  onCancelRequest?: () => void;
  onApplyWfh?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const isOff = record.status === "weekly_off" || record.status === "holiday" || record.status === "on_leave" || record.status === "comp_off";
  const isAbsent = record.status === "absent" && !record.clock_in;
  const shiftHours = shift ? parseFloat(shift.full_day_hours) || 8 : 8;
  const effectiveHours = parseFloat(record.effective_hours || record.total_hours || "0");
  const hoursCompleted = effectiveHours >= shiftHours;
  const isClockedIn = !!record.clock_in;
  const isFuture = record.date > new Date().toISOString().slice(0, 10);

  // WFH approved/pending for this date → show WFH badge
  if (wfhForDate && (wfhForDate.status === "approved" || wfhForDate.status === "pending")) {
    return (
      <div className="flex items-center justify-end gap-1.5">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
          wfhForDate.status === "approved" ? "bg-teal-100 text-teal-700" : "bg-yellow-100 text-yellow-700"
        }`}>
          WFH {wfhForDate.status}
        </span>
      </div>
    );
  }

  // Regularization pending → clock icon
  if (regularization?.status === "pending") {
    return (
      <div className="flex items-center justify-end gap-1.5">
        <div className="flex items-center gap-1 text-yellow-600" title="Regularization pending">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span className="text-[10px] font-medium">Pending</span>
        </div>
        {onCancelRequest && (
          <button type="button" onClick={onCancelRequest} className="text-text-muted hover:text-danger text-xs" title="Cancel">&times;</button>
        )}
      </div>
    );
  }

  // Regularized/approved → green check
  if (record.is_regularized || regularization?.status === "approved") {
    return (
      <div className="flex items-center justify-end text-green-600" title="Regularized">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </div>
    );
  }

  // Off/leave days — no action
  if (isOff) return null;

  // Clocked in/out + shift hours completed → green check
  if (isClockedIn && hoursCompleted && record.clock_out) {
    return (
      <div className="flex items-center justify-end text-green-600" title="Shift completed">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </div>
    );
  }

  // Clocked in but still working (no clock out yet) — in progress, no menu
  if (isClockedIn && !record.clock_out) {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700">In Progress</span>
    );
  }

  // Clocked in/out but hours NOT completed → only regularize
  if (isClockedIn && record.clock_out && !hoursCompleted) {
    const menuItems = [{ label: "Regularize", onClick: onRegularize }];
    return <ThreeDotMenu items={menuItems} />;
  }

  // Absent (past day, no clock in) → full menu
  if (isAbsent && !isFuture) {
    const menuItems: { label: string; onClick: () => void }[] = [
      { label: "Regularize", onClick: onRegularize },
      { label: "Apply Leave", onClick: () => { window.location.href = `/leaves?date=${record.date}`; } },
    ];
    if (onApplyWfh) menuItems.push({ label: "Apply WFH", onClick: onApplyWfh });
    return <ThreeDotMenu items={menuItems} />;
  }

  // Future day — no action needed in log
  return null;

  return null;
}

function ThreeDotMenu({ items }: { items: { label: string; onClick: () => void }[] }) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;

  return (
    <div className="relative flex items-center justify-end">
      <button type="button" onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-center h-7 w-7 rounded-md text-text-muted hover:bg-surface-tertiary hover:text-text-primary transition-colors" title="Actions">
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute z-30 right-0 top-full mt-1 rounded-lg border border-border bg-surface shadow-lg py-1 min-w-32">
            {items.map((item) => (
              <button key={item.label} type="button" onClick={() => { item.onClick(); setOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-tertiary hover:text-text-primary transition-colors">
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Attendance Log Table ─── */

function AttendanceLog({
  records, regularizations, wfhRequests, use24h, regularizingId, shift,
  onRegularize, onSubmitReg, onCancelReg, onCancelRequest, onApplyWfh,
}: {
  records: AttendanceRecord[];
  regularizations: RegularizationSummary[];
  wfhRequests: WfhRequest[];
  use24h: boolean;
  regularizingId: string | null;
  shift: Shift | null;
  onApplyWfh?: (date: string) => void;
  onRegularize: (id: string) => void;
  onSubmitReg: (data: { attendance_record_id: string; requested_clock_in: string; requested_clock_out: string; reason: string }) => Promise<boolean>;
  onCancelReg: () => void;
  onCancelRequest: (id: string) => Promise<boolean>;
}) {
  const regByDate = new Map<string, RegularizationSummary>();
  for (const r of regularizations) regByDate.set(r.date, r);
  const wfhByDate = new Map<string, WfhRequest>();
  for (const w of wfhRequests) wfhByDate.set(w.date, w);

  // Ensure today is always in the list (even if not clocked in)
  const todayStr = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === new Date(records[0]?.date || todayStr).getFullYear()
    && now.getMonth() === new Date(records[0]?.date || todayStr).getMonth();
  const hasToday = records.some((r) => r.date === todayStr);

  const displayRecords = (!hasToday && isCurrentMonth) ? [
    {
      id: `today-placeholder-${todayStr}`,
      date: todayStr,
      status: "absent" as const,
      clock_in: null, clock_out: null,
      total_hours: null, effective_hours: null,
      source: "", is_late: false, late_minutes: 0,
      is_early_departure: false, overtime_minutes: 0,
      is_regularized: false, remarks: null,
    } as AttendanceRecord,
    ...records,
  ] : records;

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
          {displayRecords.map((r) => {
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
                      {!isOff && !isLeave && r.work_mode && (
                        <WorkModeBadge mode={r.work_mode} source={r.work_mode_source} />
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

                  {/* Status Icon */}
                  <td className="px-4 py-3 text-right">
                    <LogStatusIcon
                      record={r}
                      shift={shift}
                      regularization={reg}
                      wfhForDate={wfhByDate.get(r.date)}
                      onRegularize={() => onRegularize(r.id)}
                      onCancelRequest={reg ? () => onCancelRequest(reg.id) : undefined}
                      onApplyWfh={onApplyWfh ? () => onApplyWfh(r.date) : undefined}
                    />
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

/* ─── Attendance Requests Tab (Regularization + WFH) ─── */

function AttendanceRequests({ regularizations, wfhRequests, onCancelReg, onCancelWfh, use24h }: {
  regularizations: RegularizationSummary[];
  wfhRequests: WfhRequest[];
  onCancelReg: (id: string) => Promise<boolean>;
  onCancelWfh: (id: string) => Promise<void>;
  use24h: boolean;
}) {
  const hasAny = regularizations.length > 0 || wfhRequests.length > 0;

  if (!hasAny) {
    return <p className="text-sm text-text-muted text-center py-8">No attendance requests.</p>;
  }

  return (
    <div className="divide-y divide-border">
      {/* Regularization requests */}
      {regularizations.map((r) => {
        const dateStr = new Date(r.date).toLocaleDateString([], { weekday: "short", day: "2-digit", month: "short" });
        return (
          <div key={`reg-${r.id}`} className="flex items-center justify-between px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold bg-purple-100 text-purple-700 uppercase">Regularize</span>
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
              <Button size="sm" variant="ghost" className="text-danger shrink-0" onClick={() => onCancelReg(r.id)}>Cancel</Button>
            )}
          </div>
        );
      })}

      {/* WFH requests */}
      {wfhRequests.map((w) => {
        const dateStr = new Date(w.date).toLocaleDateString([], { weekday: "short", day: "2-digit", month: "short" });
        return (
          <div key={`wfh-${w.id}`} className="flex items-center justify-between px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold bg-teal-100 text-teal-700 uppercase">WFH</span>
                <p className="text-sm font-medium text-text-primary">{dateStr}</p>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${REG_STATUS_STYLES[w.status]}`}>
                  {w.status}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">{w.reason}</p>
            </div>
            {w.status === "pending" && (
              <Button size="sm" variant="ghost" className="text-danger shrink-0" onClick={() => onCancelWfh(w.id)}>Cancel</Button>
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

/* ─── WFH Request Form ─── */

function WfhRequestForm({ prefillDate, onClose, onSuccess }: {
  prefillDate?: string; onClose: () => void; onSuccess: () => void;
}) {
  const [date, setDate] = useState(prefillDate || "");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [wfhError, setWfhError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !reason.trim()) return;
    setSubmitting(true);
    setWfhError("");
    try {
      await requestWfh(date, reason.trim());
      onSuccess();
      onClose();
    } catch (err) {
      setWfhError((err as ApiError).error || "Failed to request WFH.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <Card className="w-full max-w-sm mx-4 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Request Work From Home</h3>
            <button type="button" onClick={onClose} className="text-xl text-text-muted hover:text-text-primary leading-none">&times;</button>
          </div>
        </CardHeader>
        <CardContent>
          {wfhError && <Alert variant="error" className="mb-3">{wfhError}</Alert>}
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required min={new Date().toISOString().slice(0, 10)} />
            <Input label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} required placeholder="Why do you need WFH?" />
            <div className="flex gap-2 pt-1">
              <Button type="submit" loading={submitting}>Request WFH</Button>
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Main ─── */

export function AttendancePage() {
  const {
    today, state, records, summary, shift, loading, clocking, error,
    year, month, setYear, setMonth,
    handleClockIn, handleClockOut,
  } = useAttendance();
  const reg = useRegularizations();
  const [regularizingId, setRegularizingId] = useState<string | null>(null);
  const [use24h, setUse24h] = useState(false);
  const [logTab, setLogTab] = useState<LogTab>("log");
  const [wfhDate, setWfhDate] = useState<string | null>(null);
  const [wfhRequests, setWfhRequests] = useState<WfhRequest[]>([]);

  useEffect(() => {
    const refetch = () => { listWfhRequests().then(setWfhRequests).catch(() => {}); };
    refetch();
    // Approving a leave may auto-cancel overlapping WFH requests (backend side-effect).
    window.addEventListener("wfh:invalidate", refetch);
    return () => window.removeEventListener("wfh:invalidate", refetch);
  }, []);

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

      {/* WFH Request Modal */}
      {wfhDate !== null && (
        <WfhRequestForm prefillDate={wfhDate} onClose={() => setWfhDate(null)} onSuccess={() => { listWfhRequests().then(setWfhRequests).catch(() => {}); }} />
      )}

      {/* Top Row: Stats | Timings | Actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatsCard records={records} summary={summary} />
        <TimingsCard today={today} shift={shift} use24h={use24h} />
        <ActionsCard
          state={state}
          today={today}
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
            <div className="flex items-center gap-3">
              <Button size="sm" variant="secondary" onClick={() => setWfhDate("")}>
                Apply WFH
              </Button>
              <MonthPills year={year} month={month} onSelect={handleMonthSelect} />
            </div>
          </div>
        </CardHeader>

        {logTab === "log" ? (
          records.length > 0 ? (
            <AttendanceLog
              records={records}
              regularizations={reg.regularizations}
              wfhRequests={wfhRequests}
              use24h={use24h}
              regularizingId={regularizingId}
              shift={shift}
              onRegularize={setRegularizingId}
              onSubmitReg={handleSubmitReg}
              onCancelReg={() => setRegularizingId(null)}
              onCancelRequest={reg.cancel}
              onApplyWfh={(date) => setWfhDate(date)}
            />
          ) : (
            <CardContent>
              <p className="text-sm text-text-muted text-center py-8">No attendance records for this period.</p>
            </CardContent>
          )
        ) : (
          <AttendanceRequests
            regularizations={reg.regularizations}
            wfhRequests={wfhRequests}
            onCancelReg={reg.cancel}
            onCancelWfh={async (id) => { try { await cancelWfh(id); setWfhRequests((prev) => prev.filter((w) => w.id !== id)); } catch {} }}
            use24h={use24h}
          />
        )}
      </Card>
    </div>
  );
}
