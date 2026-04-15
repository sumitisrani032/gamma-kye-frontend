import { api } from "./api-client";
import type { PolicyDocument, PolicyDocumentFormData, AckReport } from "@/types";

/* ─── Employee-Facing ─── */

const BASE = "/api/v1/policy_documents";

export async function listPolicies(): Promise<PolicyDocument[]> {
  const data = await api.get<{ policy_documents: PolicyDocument[] }>(BASE);
  return data.policy_documents;
}

export async function getPolicy(id: string): Promise<PolicyDocument> {
  const data = await api.get<{ policy_document: PolicyDocument }>(`${BASE}/${id}`);
  return data.policy_document;
}

export async function getPendingAcknowledgements(): Promise<PolicyDocument[]> {
  const data = await api.get<{ pending: PolicyDocument[] }>(`${BASE}/pending_acknowledgements`);
  return data.pending;
}

export async function acknowledgePolicy(id: string): Promise<void> {
  await api.post<{ message: string }>(`${BASE}/${id}/acknowledge`);
}

/* ─── HR/Admin Management ─── */

const MANAGE = "/api/v1/manage/policy_documents";

export async function listManagedPolicies(status?: string, category?: string): Promise<PolicyDocument[]> {
  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  if (category) qs.set("category", category);
  const query = qs.toString();
  const data = await api.get<{ policy_documents: PolicyDocument[] }>(`${MANAGE}${query ? `?${query}` : ""}`);
  return data.policy_documents;
}

export async function getManagedPolicy(id: string): Promise<PolicyDocument> {
  const data = await api.get<{ policy_document: PolicyDocument }>(`${MANAGE}/${id}`);
  return data.policy_document;
}

export async function createPolicy(attachmentId: string, payload: PolicyDocumentFormData): Promise<PolicyDocument> {
  const data = await api.post<{ policy_document: PolicyDocument }>(MANAGE, { attachment_id: attachmentId, policy_document: payload });
  return data.policy_document;
}

export async function updatePolicy(id: string, payload: Partial<PolicyDocumentFormData>): Promise<PolicyDocument> {
  const data = await api.put<{ policy_document: PolicyDocument }>(`${MANAGE}/${id}`, { policy_document: payload });
  return data.policy_document;
}

export async function publishPolicy(id: string): Promise<PolicyDocument> {
  const data = await api.post<{ policy_document: PolicyDocument }>(`${MANAGE}/${id}/publish`);
  return data.policy_document;
}

export async function archivePolicy(id: string): Promise<PolicyDocument> {
  const data = await api.post<{ policy_document: PolicyDocument }>(`${MANAGE}/${id}/archive`);
  return data.policy_document;
}

export async function createNewVersion(id: string, attachmentId: string, description?: string): Promise<PolicyDocument> {
  const data = await api.post<{ policy_document: PolicyDocument }>(`${MANAGE}/${id}/new_version`, { attachment_id: attachmentId, description });
  return data.policy_document;
}

export async function deletePolicy(id: string): Promise<void> {
  await api.delete<void>(`${MANAGE}/${id}`);
}

export async function getAcknowledgementReport(id: string): Promise<AckReport> {
  return api.get<AckReport>(`${MANAGE}/${id}/acknowledgement_report`);
}

export async function sendReminder(id: string): Promise<{ message: string }> {
  return api.post<{ message: string }>(`${MANAGE}/${id}/remind`);
}
