import { api } from "./api-client";
import type { RegularizationSummary, RegularizationDetail, RegularizationFormData } from "@/types";

const BASE = "/api/v1/attendance_regularizations";

export async function listRegularizations(myRequests = true): Promise<RegularizationSummary[]> {
  const query = myRequests ? "?my_requests=true" : "";
  const data = await api.get<{ regularizations: RegularizationSummary[] }>(`${BASE}${query}`);
  return data.regularizations;
}

export async function getRegularization(id: string): Promise<RegularizationDetail> {
  const data = await api.get<{ regularization: RegularizationDetail }>(`${BASE}/${id}`);
  return data.regularization;
}

export async function submitRegularization(payload: RegularizationFormData): Promise<RegularizationDetail> {
  const data = await api.post<{ regularization: RegularizationDetail }>(BASE, payload);
  return data.regularization;
}

export async function cancelRegularization(id: string): Promise<void> {
  await api.post(`${BASE}/${id}/cancel`);
}
