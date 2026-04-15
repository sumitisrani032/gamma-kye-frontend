import { api } from "./api-client";
import type { WfhPolicy, WfhPolicyFormData } from "@/types";

const BASE = "/api/v1/manage/wfh_policies";

export async function listWfhPolicies(): Promise<WfhPolicy[]> {
  const data = await api.get<{ wfh_policies: WfhPolicy[] }>(BASE);
  return data.wfh_policies;
}

export async function getWfhPolicy(id: string): Promise<WfhPolicy> {
  const data = await api.get<{ wfh_policy: WfhPolicy }>(`${BASE}/${id}`);
  return data.wfh_policy;
}

export async function createWfhPolicy(payload: WfhPolicyFormData): Promise<WfhPolicy> {
  const data = await api.post<{ wfh_policy: WfhPolicy }>(BASE, { wfh_policy: payload });
  return data.wfh_policy;
}

export async function updateWfhPolicy(id: string, payload: Partial<WfhPolicyFormData>): Promise<WfhPolicy> {
  const data = await api.patch<{ wfh_policy: WfhPolicy }>(`${BASE}/${id}`, { wfh_policy: payload });
  return data.wfh_policy;
}

export async function deleteWfhPolicy(id: string): Promise<void> {
  await api.delete<void>(`${BASE}/${id}`);
}

/** Get the resolved WFH policy for the current employee */
export async function getMyWfhPolicy(): Promise<WfhPolicy | null> {
  const data = await api.get<{ wfh_policy: WfhPolicy | null }>("/api/v1/attendance/wfh_policy");
  return data.wfh_policy;
}
