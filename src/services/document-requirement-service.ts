import { api } from "./api-client";
import type { DocumentRequirement, DocumentRequirementFormData } from "@/types";

const BASE = "/api/v1/manage/document_requirements";

export async function listDocumentRequirements(active?: boolean): Promise<DocumentRequirement[]> {
  const query = active !== undefined ? `?active=${active}` : "";
  const data = await api.get<{ document_requirements: DocumentRequirement[] }>(`${BASE}${query}`);
  return data.document_requirements;
}

export async function createDocumentRequirement(payload: DocumentRequirementFormData): Promise<DocumentRequirement> {
  const data = await api.post<{ document_requirement: DocumentRequirement }>(BASE, { document_requirement: payload });
  return data.document_requirement;
}

export async function updateDocumentRequirement(id: string, payload: Partial<DocumentRequirementFormData>): Promise<DocumentRequirement> {
  const data = await api.put<{ document_requirement: DocumentRequirement }>(`${BASE}/${id}`, { document_requirement: payload });
  return data.document_requirement;
}

export async function deleteDocumentRequirement(id: string): Promise<void> {
  await api.delete<void>(`${BASE}/${id}`);
}
