"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, Alert } from "@/components/ui";
import { useCalendar } from "../hooks/use-calendar";
import type { CalendarDay, CalendarAction, CalendarSummary, CalendarShift, YearHoliday } from "@/services/calendar-service";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const TYPE_COLORS: Record<string, string> = {
  present: "bg-green-100 text-green-800 border-green-200",
  half_day: "bg-orange-100 text-orange-800 border-orange-200",
  absent: "bg-red-100 text-red-800 border-red-200",
  on_leave: "bg-blue-100 text-blue-800 border-blue-200",
  holiday: "bg-yellow-100 text-yellow-800 border-yellow-200",
  weekly_off: "bg-surface-tertiary text-text-muted border-border",
  regularized: "bg-green-100 text-green-800 border-green-200",
  future: "bg-white text-text-secondary border-border",
};

type Tab = "calendar" | "holidays";

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ─── Day Cell Tooltip ─── */

function DayTooltip({ day, onAction, clocking }: {
  day: CalendarDay;
  onAction: (action: CalendarAction) => void;
  clocking: boolean;
}) {
  return (
    <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-1 w-52 rounded-lg border border-border bg-surface shadow-lg p-3 text-xs">
      <p className="font-semibold text-text-primary capitalize">{day.type.replace("_", " ")}</p>
      {day.label && <p className="text-text-secondary mt-0.5">{day.label}</p>}

      {(day.type === "present" || day.type === "regularized" || day.type === "half_day") && (
        <div className="mt-2 space-y-1 text-text-muted">
          <p>In: {formatTime(day.clock_in ?? null)} · Out: {formatTime(day.clock_out ?? null)}</p>
          {day.total_hours != null && <p>Hours: {day.total_hours.toFixed(1)}h</p>}
          {day.is_late && <p className="text-yellow-600">Late by {day.late_minutes}m</p>}
        </div>
      )}

      {day.type === "holiday" && (
        <p className="mt-1 text-text-muted capitalize">{day.holiday_type}{day.is_half_day ? " · Half day" : ""}</p>
      )}

      {day.type === "on_leave" && day.leave_type_code && (
        <p className="mt-1 text-text-muted">{day.leave_type_code}{day.half ? ` (${day.half.replace("_", " ")})` : ""}</p>
      )}

      {day.actions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {day.actions.includes("clock_in") && (
            <Button size="sm" onClick={() => onAction("clock_in")} loading={clocking}>Clock In</Button>
          )}
          {day.actions.includes("clock_out") && (
            <Button size="sm" variant="secondary" onClick={() => onAction("clock_out")} loading={clocking}>Clock Out</Button>
          )}
          {day.actions.includes("regularize") && (
            <Button size="sm" variant="secondary" onClick={() => onAction("regularize")}>Regularize</Button>
          )}
          {day.actions.includes("apply_leave") && (
            <Button size="sm" variant="ghost" onClick={() => onAction("apply_leave")}>Apply Leave</Button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Day Cell ─── */

function DayCell({ day, isToday, onAction, clocking }: {
  day: CalendarDay;
  isToday: boolean;
  onAction: (date: string, action: CalendarAction) => void;
  clocking: boolean;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const dateNum = parseInt(day.date.split("-")[2], 10);
  const colorClass = day.type === "on_leave" && day.color_code
    ? "border-blue-200"
    : TYPE_COLORS[day.type] || TYPE_COLORS.future;

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        type="button"
        onClick={() => setShowTooltip((p) => !p)}
        className={`w-full aspect-square rounded-lg border p-1 text-left transition-all hover:shadow-sm ${colorClass} ${
          isToday ? "ring-2 ring-primary-500 ring-offset-1" : ""
        }`}
        style={day.type === "on_leave" && day.color_code ? { backgroundColor: `${day.color_code}20`, color: day.color_code } : undefined}
      >
        <span className={`text-xs font-medium ${isToday ? "text-primary-700" : ""}`}>{dateNum}</span>
        {day.label && day.type !== "weekly_off" && day.type !== "future" && (
          <p className="text-[8px] leading-tight truncate mt-0.5">{day.label}</p>
        )}
        {day.is_late && <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-yellow-500" />}
        {day.type === "regularized" && <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-blue-500" />}
      </button>
      {showTooltip && (
        <DayTooltip day={day} onAction={(action) => { onAction(day.date, action); setShowTooltip(false); }} clocking={clocking} />
      )}
    </div>
  );
}

/* ─── Summary Bar ─── */

function SummaryBar({ summary }: { summary: CalendarSummary }) {
  const stats = [
    { label: "Present", value: summary.present, color: "text-green-600" },
    { label: "Absent", value: summary.absent, color: "text-red-600" },
    { label: "On Leave", value: summary.on_leave, color: "text-blue-600" },
    { label: "Holidays", value: summary.holidays, color: "text-yellow-600" },
    { label: "Weekly Off", value: summary.weekly_offs, color: "text-text-muted" },
    { label: "Late", value: summary.late, color: "text-orange-600" },
    { label: "Working Days", value: summary.working_days, color: "text-text-primary" },
  ];

  return (
    <div className="flex items-center gap-4 flex-wrap text-xs">
      {stats.map((s) => (
        <span key={s.label} className="flex items-center gap-1">
          <strong className={s.color}>{s.value}</strong>
          <span className="text-text-muted">{s.label}</span>
        </span>
      ))}
    </div>
  );
}

/* ─── Shift Info ─── */

function ShiftInfo({ shift }: { shift: CalendarShift }) {
  return (
    <div className="flex items-center gap-4 text-xs text-text-secondary">
      <span>Shift: <strong className="text-text-primary">{shift.name}</strong> ({shift.start_time} – {shift.end_time})</span>
      <span>Weekly Off: <strong className="text-text-primary capitalize">{shift.weekly_offs.join(", ")}</strong></span>
    </div>
  );
}

/* ─── Holiday List Tab ─── */

function HolidayList({ holidays, year, onPrevYear, onNextYear }: {
  holidays: YearHoliday[]; year: number; onPrevYear: () => void; onNextYear: () => void;
}) {
  // Group by month
  const grouped: Record<number, YearHoliday[]> = {};
  for (const h of holidays) {
    const m = new Date(h.date + "T00:00:00").getMonth();
    if (!grouped[m]) grouped[m] = [];
    grouped[m].push(h);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-primary">Holidays {year}</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onPrevYear}>&larr; {year - 1}</Button>
          <Button size="sm" variant="ghost" onClick={onNextYear}>{year + 1} &rarr;</Button>
        </div>
      </div>

      {holidays.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-8">No holidays found for {year}.</p>
      ) : (
        Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b)).map(([monthIdx, hols]) => (
          <Card key={monthIdx}>
            <CardHeader>
              <h3 className="text-sm font-semibold text-text-primary">{MONTHS[Number(monthIdx)]}</h3>
            </CardHeader>
            <div className="divide-y divide-border">
              {hols.map((h) => {
                const d = new Date(h.date + "T00:00:00");
                const dayName = d.toLocaleDateString([], { weekday: "short" });
                const dateStr = d.toLocaleDateString([], { day: "2-digit", month: "short" });
                return (
                  <div key={h.id} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-text-primary w-20">{dateStr} {dayName}</span>
                      <span className="text-sm text-text-secondary">{h.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {h.is_half_day && <span className="text-[10px] text-orange-600 font-medium">Half day</span>}
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                        h.holiday_type === "mandatory" ? "bg-yellow-100 text-yellow-700" : "bg-surface-tertiary text-text-muted"
                      }`}>{h.holiday_type}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

/* ─── Main Calendar Component ─── */

export function CalendarPage() {
  const {
    calendar, yearHolidays, loading, error,
    year, month, setYear, prevMonth, nextMonth,
    refresh, handleClockIn, handleClockOut, clocking,
  } = useCalendar();
  const [tab, setTab] = useState<Tab>("calendar");

  const todayStr = new Date().toISOString().slice(0, 10);

  const handleDayAction = (date: string, action: CalendarAction) => {
    if (action === "clock_in") handleClockIn();
    else if (action === "clock_out") handleClockOut();
    else if (action === "apply_leave") window.location.href = `/leaves?date=${date}`;
    else if (action === "regularize") window.location.href = `/attendance?regularize=${date}`;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {(["calendar", "holidays"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t ? "border-primary-600 text-primary-700" : "border-transparent text-text-muted hover:text-text-primary"
            }`}
          >{t === "calendar" ? "Calendar" : "Holidays"}</button>
        ))}
      </div>

      {tab === "calendar" && calendar && (
        <div className="space-y-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <Button size="sm" variant="ghost" onClick={prevMonth}>&larr; {MONTHS_SHORT[month === 1 ? 11 : month - 2]}</Button>
            <h2 className="text-lg font-semibold text-text-primary">{MONTHS[month - 1]} {year}</h2>
            <Button size="sm" variant="ghost" onClick={nextMonth}>{MONTHS_SHORT[month === 12 ? 0 : month]} &rarr;</Button>
          </div>

          {/* Shift info */}
          <ShiftInfo shift={calendar.shift} />

          {/* Calendar grid */}
          <Card>
            <CardContent className="p-4">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="text-center text-[10px] font-semibold text-text-muted uppercase py-1">{d}</div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1">
                {/* Leading empty cells */}
                {(() => {
                  const firstDay = calendar.days[0];
                  if (!firstDay) return null;
                  // day_of_week: 1=Mon, 7=Sun. We need offset from Monday
                  const offset = firstDay.day_of_week - 1;
                  return Array.from({ length: offset }, (_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ));
                })()}
                {calendar.days.map((day) => (
                  <DayCell
                    key={day.date}
                    day={day}
                    isToday={day.date === todayStr}
                    onAction={handleDayAction}
                    clocking={clocking}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardContent className="py-3">
              <SummaryBar summary={calendar.summary} />
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "holidays" && (
        <HolidayList
          holidays={yearHolidays}
          year={year}
          onPrevYear={() => setYear(year - 1)}
          onNextYear={() => setYear(year + 1)}
        />
      )}
    </div>
  );
}
