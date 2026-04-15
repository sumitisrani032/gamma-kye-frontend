import { api } from "./api-client";
import type { AttendanceRecord, AttendanceSummary } from "@/types";

const BASE = "/api/v1/attendance";

export async function clockIn(source: string = "web"): Promise<AttendanceRecord> {
  const data = await api.post<{ attendance: AttendanceRecord }>(`${BASE}/clock_in`, { source });
  return data.attendance;
}

export async function clockOut(): Promise<AttendanceRecord> {
  const data = await api.post<{ attendance: AttendanceRecord }>(`${BASE}/clock_out`);
  return data.attendance;
}

export async function getToday(): Promise<AttendanceRecord | null> {
  const data = await api.get<{ attendance: AttendanceRecord | null }>(`${BASE}/today`);
  return data.attendance;
}

export async function getMonthlyRecords(year: number, month: number): Promise<AttendanceRecord[]> {
  const data = await api.get<{ attendance_records: AttendanceRecord[] }>(`${BASE}?year=${year}&month=${month}`);
  return data.attendance_records;
}

export async function getMonthlySummary(year: number, month: number): Promise<AttendanceSummary> {
  // Use my_profile endpoint — always scoped to current user
  // /attendance/monthly_summary returns org-wide data for admin users
  const data = await api.get<{ attendance_summary: AttendanceSummary }>(`/api/v1/my_profile/attendance_summary?year=${year}&month=${month}`);
  return data.attendance_summary;
}
