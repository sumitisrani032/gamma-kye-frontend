import { api } from "./api-client";
import type { LeaveBalance, LeaveRequest, LeaveRequestFormData, Pagination, PaginatedListParams } from "@/types";

const BASE = "/api/v1/leave_requests";

export interface ListLeaveRequestsResult {
  leave_requests: LeaveRequest[];
  pagination?: Pagination;
}

interface ListLeaveRequestParams extends PaginatedListParams {
  status?: string;
}

export async function getLeaveBalances(year?: number): Promise<LeaveBalance[]> {
  const query = year ? `?year=${year}` : "";
  const data = await api.get<{ leave_balances: LeaveBalance[] }>(`${BASE}/balances${query}`);
  return data.leave_balances;
}

export async function listLeaveRequests(status?: string): Promise<LeaveRequest[]> {
  const { leave_requests } = await listLeaveRequestsPaginated({ status });
  return leave_requests;
}

export async function listLeaveRequestsPaginated(params?: ListLeaveRequestParams): Promise<ListLeaveRequestsResult> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.per_page) qs.set("per_page", String(params.per_page));
  const query = qs.toString();
  const data = await api.get<{ leave_requests: LeaveRequest[]; pagination?: Pagination }>(
    `${BASE}${query ? `?${query}` : ""}`,
  );
  return { leave_requests: data.leave_requests, pagination: data.pagination };
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
