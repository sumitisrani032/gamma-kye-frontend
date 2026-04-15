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

function DayTooltip({ day, onAction, clocking }: {
  day: CalendarDay; onAction: (action: CalendarAction) => void; clocking: boolean;
}) {
  return (
    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 rounded-lg border border-border bg-surface shadow-lg p-2.5 text-xs">
      <p className="font-semibold text-text-primary capitalize">{day.type.replace("_", " ")}</p>
      {day.label && <p className="text-text-secondary">{day.label}</p>}
      {(day.type === "present" || day.type === "regularized" || day.type === "half_day") && (
        <div className="mt-1 space-y-0.5 text-text-muted">
          <p>In: {formatTime(day.clock_in ?? null)} · Out: {formatTime(day.clock_out ?? null)}</p>
          {day.total_hours != null && <p>{Number(day.total_hours).toFixed(1)}h</p>}
          {day.is_late && <p className="text-yellow-600">Late {day.late_minutes}m</p>}
        </div>
      )}
      {day.holiday_type && <p className="mt-1 text-text-muted capitalize">{day.holiday_type}</p>}
      {day.actions.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {day.actions.includes("clock_in") && <Button size="sm" onClick={() => onAction("clock_in")} loading={clocking}>Clock In</Button>}
          {day.actions.includes("clock_out") && <Button size="sm" variant="secondary" onClick={() => onAction("clock_out")} loading={clocking}>Clock Out</Button>}
          {day.actions.includes("regularize") && <Button size="sm" variant="secondary" onClick={() => onAction("regularize")}>Regularize</Button>}
          {day.actions.includes("apply_leave") && <Button size="sm" variant="ghost" onClick={() => onAction("apply_leave")}>Apply Leave</Button>}
        </div>
      )}
    </div>
  );
}

/* ─── Day Cell (compact) ─── */

function DayCell({ day, isToday, onAction, clocking }: {
  day: CalendarDay; isToday: boolean; onAction: (date: string, action: CalendarAction) => void; clocking: boolean;
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
      </button>
      {tip && <DayTooltip day={day} onAction={(a) => { onAction(day.date, a); setTip(false); }} clocking={clocking} />}
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

/* ─── Today Card ─── */

function TodayCard({ day, shift, onAction, clocking }: {
  day: CalendarDay | undefined; shift: CalendarShift; onAction: (action: CalendarAction) => void; clocking: boolean;
}) {
  if (!day) return null;
  const isWorkDay = day.type !== "weekly_off" && day.type !== "holiday";

  return (
    <Card>
      <CardHeader><h3 className="text-xs font-semibold text-text-primary">Today</h3></CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${TYPE_BG[day.type] || "bg-gray-300"}`} />
          <span className="text-sm font-medium text-text-primary capitalize">{day.type.replace("_", " ")}</span>
          {day.label && <span className="text-xs text-text-muted">({day.label})</span>}
        </div>
        {isWorkDay && (day.type === "present" || day.type === "half_day" || day.type === "regularized") && (
          <div className="text-xs text-text-muted space-y-0.5">
            <p>In: {formatTime(day.clock_in ?? null)} · Out: {formatTime(day.clock_out ?? null)}</p>
            {day.total_hours != null && <p>Hours: {Number(day.total_hours).toFixed(1)}h</p>}
          </div>
        )}
        {shift && <p className="text-[10px] text-text-muted">Shift: {shift.name} ({shift.start_time} – {shift.end_time})</p>}
        {day.actions.length > 0 && (
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
                    <DayCell key={day.date} day={day} isToday={day.date === todayStr} onAction={handleDayAction} clocking={clocking} />
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
