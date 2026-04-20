import { api } from "./api-client";

export interface CalendarShift {
  name: string;
  start_time: string;
  end_time: string;
  grace_minutes: number;
  weekly_offs: string[];
}

export interface CalendarSummary {
  total_days: number;
  working_days: number;
  present: number;
  absent: number;
  on_leave: number;
  holidays: number;
  weekly_offs: number;
  half_days: number;
  late: number;
}

export type CalendarDayType = "present" | "half_day" | "absent" | "on_leave" | "holiday" | "weekly_off" | "regularized" | "future";
export type CalendarAction = "apply_leave" | "regularize" | "clock_in" | "clock_out" | "request_wfh";
export type CalendarWorkMode = "office" | "wfh";
export type CalendarWfhStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface CalendarDay {
  date: string;
  day_name: string;
  day_of_week: number;
  type: CalendarDayType;
  label?: string | null;
  clock_in?: string | null;
  clock_out?: string | null;
  total_hours?: number | null;
  is_late?: boolean;
  late_minutes?: number;
  holiday_type?: string;
  is_half_day?: boolean;
  leave_type_code?: string;
  color_code?: string;
  half?: string | null;
  /** "office" | "wfh" — if the day's work location is resolved. */
  work_mode?: CalendarWorkMode;
  /** Set only on future dates that have an open WFH request (usually "pending"). */
  wfh_status?: CalendarWfhStatus;
  actions: CalendarAction[];
}

export interface MonthlyCalendar {
  year: number;
  month: number;
  shift: CalendarShift;
  summary: CalendarSummary;
  days: CalendarDay[];
}

export interface UpcomingHoliday {
  id: string;
  name: string;
  date: string;
  holiday_type: string;
  is_half_day: boolean;
  days_away: number;
}

export interface YearHoliday {
  id: string;
  name: string;
  date: string;
  holiday_type: string;
  is_half_day: boolean;
  description: string | null;
}

export async function getMonthlyCalendar(year: number, month: number): Promise<MonthlyCalendar> {
  return api.get<MonthlyCalendar>(`/api/v1/calendar/monthly?year=${year}&month=${month}`);
}

export async function getUpcomingHolidays(limit = 5): Promise<UpcomingHoliday[]> {
  const data = await api.get<{ holidays: UpcomingHoliday[] }>(`/api/v1/calendar/upcoming?limit=${limit}`);
  return data.holidays;
}

export async function getYearHolidays(year: number): Promise<YearHoliday[]> {
  const data = await api.get<{ holidays: YearHoliday[]; year: number }>(`/api/v1/calendar/holidays?year=${year}`);
  return data.holidays;
}
