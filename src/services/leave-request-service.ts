import { api } from "./api-client";
import type { LeaveBalance, LeaveRequest, LeaveRequestFormData } from "@/types";

const BASE = "/api/v1/leave_requests";

export async function getLeaveBalances(year?: number): Promise<LeaveBalance[]> {
  const query = year ? `?year=${year}` : "";
  const data = await api.get<{ leave_balances: LeaveBalance[] }>(`${BASE}/balances${query}`);
  return data.leave_balances;
}

export async function listLeaveRequests(status?: string): Promise<LeaveRequest[]> {
  const query = status ? `?status=${status}` : "";
  const data = await api.get<{ leave_requests: LeaveRequest[] }>(`${BASE}${query}`);
  return data.leave_requests;
}

export async function getLeaveRequest(id: string): Promise<LeaveRequest> {
  const data = await api.get<{ leave_request: LeaveRequest }>(`${BASE}/${id}`);
  return data.leave_request;
}

export async function applyLeave(payload: LeaveRequestFormData): Promise<LeaveRequest> {
  const data = await api.post<{ leave_request: LeaveRequest }>(BASE, payload);
  return data.leave_request;
}

export async function cancelLeaveRequest(id: string, reason: string): Promise<LeaveRequest> {
  const data = await api.post<{ leave_request: LeaveRequest }>(`${BASE}/${id}/cancel`, { reason });
  return data.leave_request;
}
