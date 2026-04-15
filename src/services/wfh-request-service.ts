import { api } from "./api-client";

export interface WfhRequest {
  id: string;
  date: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  created_at: string;
}

const BASE = "/api/v1/attendance";

export async function listWfhRequests(): Promise<WfhRequest[]> {
  const data = await api.get<{ wfh_requests: WfhRequest[] }>(`${BASE}/wfh_requests`);
  return data.wfh_requests;
}

export async function requestWfh(date: string, reason: string): Promise<WfhRequest> {
  const data = await api.post<{ wfh_request: WfhRequest }>(`${BASE}/request_wfh`, { date, reason });
  return data.wfh_request;
}

export async function cancelWfh(id: string): Promise<void> {
  await api.post<{ message: string }>(`${BASE}/cancel_wfh/${id}`);
}
