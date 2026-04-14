import { api } from "./api-client";
import type { LeavePolicySummary, LeavePolicyDetail, LeavePolicyFormData } from "@/types";

const BASE = "/api/v1/manage/leave_policies";

export async function listLeavePolicies(leaveTypeId?: string): Promise<LeavePolicySummary[]> {
  const query = leaveTypeId ? `?leave_type_id=${leaveTypeId}` : "";
  const data = await api.get<{ leave_policies: LeavePolicySummary[] }>(`${BASE}${query}`);
  return data.leave_policies;
}

export async function getLeavePolicy(id: string): Promise<LeavePolicyDetail> {
  const data = await api.get<{ leave_policy: LeavePolicyDetail }>(`${BASE}/${id}`);
  return data.leave_policy;
}

export async function createLeavePolicy(leave_policy: LeavePolicyFormData): Promise<LeavePolicyDetail> {
  const data = await api.post<{ leave_policy: LeavePolicyDetail }>(BASE, { leave_policy });
  return data.leave_policy;
}

export async function updateLeavePolicy(id: string, leave_policy: Partial<LeavePolicyFormData>): Promise<LeavePolicyDetail> {
  const data = await api.put<{ leave_policy: LeavePolicyDetail }>(`${BASE}/${id}`, { leave_policy });
  return data.leave_policy;
}

export async function deleteLeavePolicy(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}
