import { api } from "./api-client";
import type { AttendanceRecord, AttendanceSummary, TodayAttendanceResponse } from "@/types";

const BASE = "/api/v1/attendance";

export async function clockIn(source: string = "web"): Promise<AttendanceRecord> {
  const data = await api.post<{ attendance: AttendanceRecord }>(`${BASE}/clock_in`, { source });
  return data.attendance;
}

export async function clockOut(): Promise<AttendanceRecord> {
  const data = await api.post<{ attendance: AttendanceRecord }>(`${BASE}/clock_out`);
  return data.attendance;
}

export async function getToday(): Promise<TodayAttendanceResponse> {
  return api.get<TodayAttendanceResponse>(`${BASE}/today`);
}

export async function getMonthlyRecords(year: number, month: number): Promise<AttendanceRecord[]> {
  const data = await api.get<{ attendance_records: AttendanceRecord[] }>(`${BASE}?year=${year}&month=${month}`);
  return data.attendance_records;
}

export async function getMonthlySummary(year: number, month: number): Promise<AttendanceSummary> {
  const data = await api.get<{ attendance_summary: AttendanceSummary }>(`/api/v1/my_profile/attendance_summary?year=${year}&month=${month}`);
  return data.attendance_summary;
}
