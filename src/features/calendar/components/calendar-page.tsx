"use client";

import { useState, useEffect } from "react";
import { Button, Card, CardContent, CardHeader, Alert } from "@/components/ui";
import { useCalendar } from "../hooks/use-calendar";
import { getUpcomingHolidays } from "@/services/calendar-service";
import type { CalendarDay, CalendarAction, CalendarSummary, CalendarShift, YearHoliday, UpcomingHoliday } from "@/services/calendar-service";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const TYPE_BG: Record<string, string> = {
  present: "bg-green-500",
  half_day: "bg-orange-400",
  absent: "bg-red-500",
  on_leave: "bg-blue-500",
  holiday: "bg-yellow-500",
  weekly_off: "bg-gray-300",
  regularized: "bg-green-500",
  future: "bg-transparent",
};

const TYPE_CELL: Record<string, string> = {
  present: "bg-green-50 text-green-800 hover:bg-green-100",
  half_day: "bg-orange-50 text-orange-800 hover:bg-orange-100",
  absent: "bg-red-50 text-red-800 hover:bg-red-100",
  on_leave: "bg-blue-50 text-blue-800 hover:bg-blue-100",
  holiday: "bg-yellow-50 text-yellow-800 hover:bg-yellow-100",
  weekly_off: "bg-surface-secondary text-text-muted",
  regularized: "bg-green-50 text-green-800 hover:bg-green-100",
  future: "hover:bg-surface-secondary text-text-secondary",
};

type Tab = "calendar" | "holidays";

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ─── Day Tooltip ─── */

function DayTooltip({ day, shift, onAction, clocking }: {
  day: CalendarDay; shift: CalendarShift | null; onAction: (action: CalendarAction) => void; clocking: boolean;
}) {
  const hasClock = day.type === "present" || day.type === "regularized" || day.type === "half_day";

  return (
    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 w-56 rounded-lg border border-border bg-surface shadow-lg p-2.5 text-xs">
      <div className="flex items-center justify-between mb-1">
        <p className="font-semibold text-text-primary capitalize">{day.type.replace("_", " ")}</p>
        {day.total_hours != null && <span className="text-primary-600 font-bold">{Number(day.total_hours).toFixed(1)}h</span>}
      </div>
      {day.label && <p className="text-text-secondary">{day.label}</p>}

      {/* Timeline bar for work days */}
      {hasClock && (
        <div className="mt-2">
          <TimelineBar shift={shift} clockIn={day.clock_in ?? null} clockOut={day.clock_out ?? null} isLate={day.is_late} lateMinutes={day.late_minutes} />
          <div className="flex items-center gap-2 mt-1 text-text-muted">
            <span>In: <strong className="text-green-600">{formatTime(day.clock_in ?? null)}</strong></span>
            <span>Out: <strong className="text-text-primary">{formatTime(day.clock_out ?? null)}</strong></span>
          </div>
        </div>
      )}

      {day.holiday_type && <p className="mt-1 text-text-muted capitalize">{day.holiday_type}</p>}
      {day.work_mode && (
        <p className="mt-1 text-text-secondary">
          {day.work_mode === "wfh" ? "🏠 Work from home" : "🏢 Office"}
        </p>
      )}
      {day.wfh_status === "pending" && (
        <p className="mt-0.5 text-yellow-700">WFH request pending</p>
      )}
      {day.actions.length > 0 && day.type !== "on_leave" && day.type !== "holiday" && day.type !== "weekly_off" && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {day.actions.includes("clock_in") && <Button size="sm" onClick={() => onAction("clock_in")} loading={clocking}>Clock In</Button>}
          {day.actions.includes("clock_out") && <Button size="sm" variant="secondary" onClick={() => onAction("clock_out")} loading={clocking}>Clock Out</Button>}
          {day.actions.includes("regularize") && <Button size="sm" variant="secondary" onClick={() => onAction("regularize")}>Regularize</Button>}
          {day.actions.includes("apply_leave") && <Button size="sm" variant="ghost" onClick={() => onAction("apply_leave")}>Apply Leave</Button>}
          {day.actions.includes("request_wfh") && <Button size="sm" variant="ghost" onClick={() => onAction("request_wfh")}>Request WFH</Button>}
        </div>
      )}
    </div>
  );
}

/* ─── Day Cell (compact) ─── */

function DayCell({ day, isToday, shift, onAction, clocking }: {
  day: CalendarDay; isToday: boolean; shift: CalendarShift | null; onAction: (date: string, action: CalendarAction) => void; clocking: boolean;
}) {
  const [tip, setTip] = useState(false);
  const dateNum = parseInt(day.date.split("-")[2], 10);
  const cellClass = day.type === "on_leave" && day.color_code ? "" : (TYPE_CELL[day.type] || TYPE_CELL.future);

  return (
    <div className="relative" onMouseEnter={() => setTip(true)} onMouseLeave={() => setTip(false)}>
      <button
        type="button"
        onClick={() => setTip((p) => !p)}
        className={`w-full h-9 rounded-md flex items-center justify-center text-xs font-medium transition-colors ${cellClass} ${
          isToday ? "ring-2 ring-primary-500" : ""
        }`}
        style={day.type === "on_leave" && day.color_code ? { backgroundColor: `${day.color_code}15`, color: day.color_code } : undefined}
      >
        {dateNum}
        {day.is_late && <span className="absolute top-0.5 right-0.5 h-1 w-1 rounded-full bg-yellow-500" />}
        {day.work_mode === "wfh" && (
          <span className="absolute bottom-0.5 left-0.5 text-[9px] leading-none" aria-label="Work from home">🏠</span>
        )}
        {day.wfh_status === "pending" && (
          <span className="absolute bottom-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-yellow-400 ring-1 ring-yellow-500" title="WFH pending" />
        )}
      </button>
      {tip && <DayTooltip day={day} shift={shift} onAction={(a) => { onAction(day.date, a); setTip(false); }} clocking={clocking} />}
    </div>
  );
}

/* ─── Legend ─── */

function Legend() {
  const items = [
    { label: "Present", color: "bg-green-500" },
    { label: "Absent", color: "bg-red-500" },
    { label: "On Leave", color: "bg-blue-500" },
    { label: "Holiday", color: "bg-yellow-500" },
    { label: "Weekly Off", color: "bg-gray-300" },
    { label: "Half Day", color: "bg-orange-400" },
    { label: "Late", color: "bg-yellow-500 ring-1 ring-yellow-600" },
  ];
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-1">
          <span className={`h-2 w-2 rounded-full ${i.color}`} />
          <span className="text-[10px] text-text-muted">{i.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Upcoming Holidays Widget ─── */

function UpcomingHolidaysWidget() {
  const [holidays, setHolidays] = useState<UpcomingHoliday[]>([]);
  useEffect(() => { getUpcomingHolidays(5).then(setHolidays).catch(() => {}); }, []);

  if (holidays.length === 0) return null;
  return (
    <Card>
      <CardHeader><h3 className="text-xs font-semibold text-text-primary">Upcoming Holidays</h3></CardHeader>
      <div className="divide-y divide-border">
        {holidays.map((h) => (
          <div key={h.id} className="flex items-center justify-between px-4 py-2">
            <div>
              <p className="text-xs font-medium text-text-primary">{h.name}</p>
              <p className="text-[10px] text-text-muted">
                {new Date(h.date + "T00:00:00").toLocaleDateString([], { day: "2-digit", month: "short", weekday: "short" })}
              </p>
            </div>
            <span className="text-[10px] text-text-muted">{h.days_away}d away</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ─── Attendance Timeline Bar ─── */

function parseHM(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h + m / 60;
}

function isoToHour(iso: string): number {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60;
}

function TimelineBar({ shift, clockIn, clockOut, isLate, lateMinutes }: {
  shift: CalendarShift | null; clockIn: string | null; clockOut: string | null; isLate?: boolean; lateMinutes?: number;
}) {
  // 24h bar but zoom to relevant range (6 AM – 10 PM = 16h)
  const rangeStart = 6;
  const rangeEnd = 22;
  const rangeHours = rangeEnd - rangeStart;
  const toPct = (h: number) => Math.max(0, Math.min(100, ((h - rangeStart) / rangeHours) * 100));

  const shiftStart = shift ? parseHM(shift.start_time) : null;
  const shiftEnd = shift ? parseHM(shift.end_time) : null;
  const inHour = clockIn ? isoToHour(clockIn) : null;
  const outHour = clockOut ? isoToHour(clockOut) : (inHour ? new Date().getHours() + new Date().getMinutes() / 60 : null);

  // Hour markers
  const hours = [6, 8, 10, 12, 14, 16, 18, 20, 22];

  return (
    <div className="space-y-1">
      <div className="relative h-6 rounded bg-surface-tertiary overflow-hidden">
        {/* Shift window */}
        {shiftStart != null && shiftEnd != null && (
          <div
            className="absolute top-0 h-full bg-primary-100 border-x border-primary-300"
            style={{ left: `${toPct(shiftStart)}%`, width: `${toPct(shiftEnd) - toPct(shiftStart)}%` }}
          />
        )}

        {/* Clock in/out fill */}
        {inHour != null && outHour != null && (
          <div
            className="absolute top-1 bottom-1 rounded-sm bg-primary-500"
            style={{ left: `${toPct(inHour)}%`, width: `${Math.max(0.5, toPct(outHour) - toPct(inHour))}%` }}
          />
        )}

        {/* Clock in marker */}
        {inHour != null && (
          <div className="absolute top-0 h-full w-0.5 bg-green-600" style={{ left: `${toPct(inHour)}%` }} title={`In: ${clockIn ? formatTime(clockIn) : ""}`} />
        )}

        {/* Clock out marker */}
        {clockOut && outHour != null && (
          <div className="absolute top-0 h-full w-0.5 bg-red-500" style={{ left: `${toPct(outHour)}%` }} title={`Out: ${formatTime(clockOut)}`} />
        )}

        {/* Shift start/end labels */}
        {shiftStart != null && (
          <span className="absolute top-0.5 text-[8px] text-primary-600 font-medium" style={{ left: `${toPct(shiftStart)}%`, transform: "translateX(2px)" }}>
            {shift?.start_time}
          </span>
        )}
        {shiftEnd != null && (
          <span className="absolute top-0.5 text-[8px] text-primary-600 font-medium" style={{ left: `${toPct(shiftEnd)}%`, transform: "translateX(-100%)" }}>
            {shift?.end_time}
          </span>
        )}
      </div>

      {/* Hour ticks */}
      <div className="relative h-3">
        {hours.map((h) => (
          <span key={h} className="absolute text-[8px] text-text-muted -translate-x-1/2" style={{ left: `${toPct(h)}%` }}>
            {h > 12 ? `${h - 12}P` : h === 12 ? "12P" : `${h}A`}
          </span>
        ))}
      </div>

      {/* Late indicator */}
      {isLate && lateMinutes && lateMinutes > 0 && (
        <p className="text-[10px] text-yellow-600 font-medium">{lateMinutes} min late</p>
      )}
    </div>
  );
}

/* ─── Today Card ─── */

function TodayCard({ day, shift, onAction, clocking }: {
  day: CalendarDay | undefined; shift: CalendarShift | null; onAction: (action: CalendarAction) => void; clocking: boolean;
}) {
  if (!day) return null;
  const isWorkDay = day.type !== "weekly_off" && day.type !== "holiday" && day.type !== "on_leave";
  const hasClock = day.type === "present" || day.type === "half_day" || day.type === "regularized" || day.type === "absent";

  return (
    <Card>
      <CardContent className="py-4 px-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${day.type === "present" || day.type === "regularized" ? "bg-green-100" : day.type === "absent" ? "bg-red-100" : "bg-surface-tertiary"}`}>
              <svg className={`h-3.5 w-3.5 ${day.type === "present" || day.type === "regularized" ? "text-green-600" : day.type === "absent" ? "text-red-600" : "text-text-muted"}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-text-primary">Today</h3>
              <p className="text-[10px] text-text-muted capitalize">{day.type.replace("_", " ")}{day.label ? ` · ${day.label}` : ""}</p>
            </div>
          </div>
          {day.total_hours != null && (
            <span className="text-sm font-bold text-primary-600">{Number(day.total_hours).toFixed(1)}h</span>
          )}
        </div>

        {/* Timeline Bar */}
        {isWorkDay && hasClock && (
          <TimelineBar
            shift={shift}
            clockIn={day.clock_in ?? null}
            clockOut={day.clock_out ?? null}
            isLate={day.is_late}
            lateMinutes={day.late_minutes}
          />
        )}

        {/* Clock times */}
        {hasClock && day.clock_in && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-text-muted">In: <strong className="text-green-600">{formatTime(day.clock_in)}</strong></span>
            <span className="text-text-muted">Out: <strong className={day.clock_out ? "text-red-500" : "text-text-muted"}>{day.clock_out ? formatTime(day.clock_out) : "—"}</strong></span>
          </div>
        )}

        {shift && <p className="text-[10px] text-text-muted">Shift: {shift.name} ({shift.start_time} – {shift.end_time})</p>}

        {day.actions.length > 0 && day.type !== "on_leave" && day.type !== "holiday" && day.type !== "weekly_off" && (
          <div className="flex gap-1.5 pt-1">
            {day.actions.includes("clock_in") && <Button size="sm" onClick={() => onAction("clock_in")} loading={clocking}>Clock In</Button>}
            {day.actions.includes("clock_out") && <Button size="sm" variant="secondary" onClick={() => onAction("clock_out")} loading={clocking}>Clock Out</Button>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Summary Card ─── */

function SummaryCard({ summary }: { summary: CalendarSummary }) {
  const items = [
    { label: "Working", value: summary.working_days, color: "" },
    { label: "Present", value: summary.present, color: "text-green-600" },
    { label: "Absent", value: summary.absent, color: "text-red-600" },
    { label: "Leave", value: summary.on_leave, color: "text-blue-600" },
    { label: "Late", value: summary.late, color: "text-orange-600" },
    { label: "Holidays", value: summary.holidays, color: "text-yellow-600" },
  ];
  return (
    <Card>
      <CardHeader><h3 className="text-xs font-semibold text-text-primary">Monthly Summary</h3></CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {items.map((s) => (
            <div key={s.label} className="text-center">
              <p className={`text-lg font-bold ${s.color || "text-text-primary"}`}>{s.value}</p>
              <p className="text-[10px] text-text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Holiday List Tab ─── */

function HolidayList({ holidays, year, onPrevYear, onNextYear }: {
  holidays: YearHoliday[]; year: number; onPrevYear: () => void; onNextYear: () => void;
}) {
  const grouped: Record<number, YearHoliday[]> = {};
  for (const h of holidays) {
    const m = new Date(h.date + "T00:00:00").getMonth();
    if (!grouped[m]) grouped[m] = [];
    grouped[m].push(h);
  }

  const mandatory = holidays.filter((h) => h.holiday_type === "mandatory").length;
  const optional = holidays.filter((h) => h.holiday_type === "optional").length;

  // Next upcoming holiday
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcoming = holidays.filter((h) => h.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date));
  const next = upcoming[0];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left: Holiday list */}
      <div className="lg:col-span-2 space-y-3">
        <div className="flex items-center justify-between">
          <Button size="sm" variant="ghost" onClick={onPrevYear}>&larr; {year - 1}</Button>
          <h2 className="text-sm font-semibold text-text-primary">Holidays {year}</h2>
          <Button size="sm" variant="ghost" onClick={onNextYear}>{year + 1} &rarr;</Button>
        </div>
        {holidays.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8">No holidays for {year}.</p>
        ) : (
          <Card>
            <div className="divide-y divide-border">
              {Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b)).map(([mIdx, hols]) => (
                <div key={mIdx}>
                  <div className="px-4 py-2 bg-surface-secondary">
                    <p className="text-xs font-semibold text-text-muted">{MONTHS[Number(mIdx)]}</p>
                  </div>
                  {hols.map((h) => {
                    const d = new Date(h.date + "T00:00:00");
                    const isPast = h.date < todayStr;
                    return (
                      <div key={h.id} className={`flex items-center justify-between px-4 py-2 ${isPast ? "opacity-50" : ""}`}>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-text-primary w-16">
                            {d.toLocaleDateString([], { day: "2-digit", month: "short" })}
                          </span>
                          <span className="text-xs text-text-muted w-8">{d.toLocaleDateString([], { weekday: "short" })}</span>
                          <span className="text-xs text-text-secondary">{h.name}</span>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                          h.holiday_type === "mandatory" ? "bg-yellow-100 text-yellow-700" : "bg-surface-tertiary text-text-muted"
                        }`}>{h.holiday_type}{h.is_half_day ? " · Half" : ""}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Right: Stats */}
      <div className="space-y-4">
        {/* Holiday summary */}
        <Card>
          <CardHeader><h3 className="text-xs font-semibold text-text-primary">Summary</h3></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-2xl font-bold text-text-primary">{holidays.length}</p>
                <p className="text-[10px] text-text-muted">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{mandatory}</p>
                <p className="text-[10px] text-text-muted">Mandatory</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-muted">{optional}</p>
                <p className="text-[10px] text-text-muted">Optional</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next holiday */}
        {next && (
          <Card>
            <CardHeader><h3 className="text-xs font-semibold text-text-primary">Next Holiday</h3></CardHeader>
            <CardContent className="text-center space-y-1">
              <p className="text-lg font-bold text-text-primary">{next.name}</p>
              <p className="text-sm text-text-secondary">
                {new Date(next.date + "T00:00:00").toLocaleDateString([], { weekday: "long", day: "2-digit", month: "long" })}
              </p>
              <p className="text-xs text-primary-600 font-medium">
                {Math.ceil((new Date(next.date).getTime() - Date.now()) / 86400000)} days away
              </p>
            </CardContent>
          </Card>
        )}

        {/* Remaining this year */}
        <Card>
          <CardHeader><h3 className="text-xs font-semibold text-text-primary">Remaining This Year</h3></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-text-primary text-center">{upcoming.length}</p>
            <p className="text-[10px] text-text-muted text-center">holidays left</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ─── Main ─── */

export function CalendarPage() {
  const {
    calendar, yearHolidays, loading, error,
    year, month, setYear, prevMonth, nextMonth,
    handleClockIn, handleClockOut, clocking,
  } = useCalendar();
  const [tab, setTab] = useState<Tab>("calendar");
  const todayStr = new Date().toISOString().slice(0, 10);

  const handleDayAction = (date: string, action: CalendarAction) => {
    if (action === "clock_in") handleClockIn();
    else if (action === "clock_out") handleClockOut();
    else if (action === "apply_leave") window.location.href = `/leaves?date=${date}`;
    else if (action === "regularize") window.location.href = `/attendance?regularize=${date}`;
    else if (action === "request_wfh") window.location.href = `/attendance?wfh=${date}`;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  }

  const todayDay = calendar?.days.find((d) => d.date === todayStr);

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {(["calendar", "holidays"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? "border-primary-600 text-primary-700" : "border-transparent text-text-muted hover:text-text-primary"
            }`}
          >{t === "calendar" ? "Calendar" : `Holidays (${yearHolidays.length})`}</button>
        ))}
      </div>

      {tab === "calendar" && calendar && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: Calendar grid */}
          <div className="lg:col-span-2 space-y-3">
            {/* Month nav */}
            <div className="flex items-center justify-between">
              <Button size="sm" variant="ghost" onClick={prevMonth}>&larr;</Button>
              <h2 className="text-sm font-semibold text-text-primary">{MONTHS[month - 1]} {year}</h2>
              <Button size="sm" variant="ghost" onClick={nextMonth}>&rarr;</Button>
            </div>

            {/* Grid */}
            <Card>
              <CardContent className="p-3">
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {WEEKDAYS.map((d) => (
                    <div key={d} className="text-center text-[10px] font-semibold text-text-muted py-0.5">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    const firstDay = calendar.days[0];
                    if (!firstDay) return null;
                    const offset = firstDay.day_of_week - 1;
                    return Array.from({ length: offset }, (_, i) => <div key={`e-${i}`} className="h-9" />);
                  })()}
                  {calendar.days.map((day) => (
                    <DayCell key={day.date} day={day} isToday={day.date === todayStr} shift={calendar.shift} onAction={handleDayAction} clocking={clocking} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Legend */}
            <Legend />

            {/* Shift info */}
            {calendar.shift && (
              <p className="text-[10px] text-text-muted">
                Shift: {calendar.shift.name} ({calendar.shift.start_time} – {calendar.shift.end_time}) · Weekly off: {calendar.shift.weekly_offs.join(", ")}
              </p>
            )}
          </div>

          {/* Right: Sidebar widgets */}
          <div className="space-y-4">
            <TodayCard day={todayDay} shift={calendar.shift} onAction={(a) => handleDayAction(todayStr, a)} clocking={clocking} />
            <SummaryCard summary={calendar.summary} />
            <UpcomingHolidaysWidget />
          </div>
        </div>
      )}

      {tab === "holidays" && (
        <HolidayList holidays={yearHolidays} year={year} onPrevYear={() => setYear(year - 1)} onNextYear={() => setYear(year + 1)} />
      )}
    </div>
  );
}
