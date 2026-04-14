import { api } from "./api-client";
import type { LeaveBalance, LeaveRequest, LeaveRequestFormData } from "@/types";

const BASE = "/api/v1/leave_requests";

export async function getLeaveBalances(year?: number): Promise<LeaveBalance[]> {
  const query = year ? `?year=${year}` : "";
  const data = await api.get<{ leave_balances: LeaveBalance[] }>(`${BASE}/balances${query}`);
  return data.leave_balances;
}

interface LeaveListParams {
  status?: string;
  my_requests?: boolean;
}

export async function listLeaveRequests(params?: LeaveListParams | string): Promise<LeaveRequest[]> {
  const qs = new URLSearchParams();
  if (typeof params === "string") {
    // Backward compat: listLeaveRequests("approved")
    if (params) qs.set("status", params);
  } else if (params) {
    if (params.status) qs.set("status", params.status);
    if (params.my_requests) qs.set("my_requests", "true");
  }
  const query = qs.toString();
  const data = await api.get<{ leave_requests: LeaveRequest[] }>(`${BASE}${query ? `?${query}` : ""}`);
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
