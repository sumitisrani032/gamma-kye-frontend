import { api } from "./api-client";
import type { LeaveTypeSummary, LeaveTypeDetail, LeaveTypeFormData } from "@/types";

const BASE = "/api/v1/manage/leave_types";

export async function listLeaveTypes(active?: boolean): Promise<LeaveTypeSummary[]> {
  const query = active !== undefined ? `?active=${active}` : "";
  const data = await api.get<{ leave_types: LeaveTypeSummary[] }>(`${BASE}${query}`);
  return data.leave_types;
}

export async function getLeaveType(id: string): Promise<LeaveTypeDetail> {
  const data = await api.get<{ leave_type: LeaveTypeDetail }>(`${BASE}/${id}`);
  return data.leave_type;
}

export async function createLeaveType(leave_type: LeaveTypeFormData): Promise<LeaveTypeDetail> {
  const data = await api.post<{ leave_type: LeaveTypeDetail }>(BASE, { leave_type });
  return data.leave_type;
}

export async function updateLeaveType(id: string, leave_type: Partial<LeaveTypeFormData>): Promise<LeaveTypeDetail> {
  const data = await api.put<{ leave_type: LeaveTypeDetail }>(`${BASE}/${id}`, { leave_type });
  return data.leave_type;
}

export async function deleteLeaveType(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}
