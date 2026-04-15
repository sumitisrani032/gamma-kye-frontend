import { api } from "./api-client";
import type { EmployeeDocument, RequirementWithStatus } from "@/types";

/* ─── Employee Self-Service ─── */

const MY = "/api/v1/my_documents";

export async function listMyDocuments(): Promise<EmployeeDocument[]> {
  const data = await api.get<{ documents: EmployeeDocument[] }>(MY);
  return data.documents;
}

export async function getMyDocument(id: string): Promise<EmployeeDocument> {
  const data = await api.get<{ document: EmployeeDocument }>(`${MY}/${id}`);
  return data.document;
}

export async function getMyRequirements(): Promise<RequirementWithStatus[]> {
  const data = await api.get<{ requirements: RequirementWithStatus[] }>(`${MY}/requirements`);
  return data.requirements;
}

export async function uploadMyDocument(payload: {
  document_requirement_id: string;
  attachment_id: string;
  document_name: string;
  description?: string;
  expires_at?: string;
}): Promise<EmployeeDocument> {
  const data = await api.post<{ document: EmployeeDocument }>(MY, payload);
  return data.document;
}

export async function reuploadMyDocument(id: string, payload: {
  attachment_id: string;
  document_name?: string;
}): Promise<EmployeeDocument> {
  const data = await api.put<{ document: EmployeeDocument }>(`${MY}/${id}`, payload);
  return data.document;
}

export async function deleteMyDocument(id: string): Promise<void> {
  await api.delete<void>(`${MY}/${id}`);
}

/* ─── HR/Admin Verification ─── */

const MANAGE = "/api/v1/manage/document_verifications";

export async function listVerifications(params?: { status?: string; document_type?: string }): Promise<EmployeeDocument[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.document_type) qs.set("document_type", params.document_type);
  const query = qs.toString();
  const data = await api.get<{ documents: EmployeeDocument[] }>(`${MANAGE}${query ? `?${query}` : ""}`);
  return data.documents;
}

export async function verifyDocument(id: string): Promise<EmployeeDocument> {
  const data = await api.post<{ document: EmployeeDocument }>(`${MANAGE}/${id}/verify`);
  return data.document;
}

export async function rejectDocument(id: string, reason: string): Promise<EmployeeDocument> {
  const data = await api.post<{ document: EmployeeDocument }>(`${MANAGE}/${id}/reject`, { reason });
  return data.document;
}

export async function getComplianceReport(departmentId?: string): Promise<{
  compliance: { employee: { id: string; name: string; department: string }; total_required: number; submitted: number; verified: number; pending: number; rejected: number; missing: number }[];
}> {
  const query = departmentId ? `?department_id=${departmentId}` : "";
  return api.get(`${MANAGE}/compliance_report${query}`);
}
