import { api } from "./api-client";
import type {
  HolidayCalendarSummary,
  HolidayCalendarDetail,
  HolidayCalendarFormData,
  Holiday,
  HolidayFormData,
} from "@/types";

const BASE = "/api/v1/manage/holiday_calendars";

/* ---------- Calendars ---------- */

export async function listHolidayCalendars(year?: number): Promise<HolidayCalendarSummary[]> {
  const query = year ? `?year=${year}` : "";
  const data = await api.get<{ holiday_calendars: HolidayCalendarSummary[] }>(`${BASE}${query}`);
  return data.holiday_calendars;
}

export async function getHolidayCalendar(id: string): Promise<HolidayCalendarDetail> {
  const data = await api.get<{ holiday_calendar: HolidayCalendarDetail }>(`${BASE}/${id}`);
  return data.holiday_calendar;
}

export async function createHolidayCalendar(holiday_calendar: HolidayCalendarFormData): Promise<HolidayCalendarSummary> {
  const data = await api.post<{ holiday_calendar: HolidayCalendarSummary }>(BASE, { holiday_calendar });
  return data.holiday_calendar;
}

export async function deleteHolidayCalendar(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}

/* ---------- Holidays (nested) ---------- */

export async function addHoliday(calendarId: string, holiday: HolidayFormData): Promise<Holiday> {
  const data = await api.post<{ holiday: Holiday }>(`${BASE}/${calendarId}/holidays`, { holiday });
  return data.holiday;
}

export async function updateHoliday(calendarId: string, holidayId: string, holiday: Partial<HolidayFormData>): Promise<void> {
  await api.put(`${BASE}/${calendarId}/holidays/${holidayId}`, { holiday });
}

export async function deleteHoliday(calendarId: string, holidayId: string): Promise<void> {
  await api.delete(`${BASE}/${calendarId}/holidays/${holidayId}`);
}
