import { api } from "./api-client";
import type { Designation, DesignationFormData } from "@/types";

const BASE = "/api/v1/manage/designations";

export async function listDesignations(): Promise<Designation[]> {
  const data = await api.get<{ designations: Designation[] }>(BASE);
  return data.designations;
}

export async function createDesignation(designation: DesignationFormData): Promise<Designation> {
  const data = await api.post<{ designation: Designation }>(BASE, { designation });
  return data.designation;
}

export async function updateDesignation(id: string, designation: Partial<DesignationFormData>): Promise<Designation> {
  const data = await api.put<{ designation: Designation }>(`${BASE}/${id}`, { designation });
  return data.designation;
}

export async function deleteDesignation(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}
