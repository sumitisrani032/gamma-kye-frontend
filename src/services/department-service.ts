import { api } from "./api-client";
import type { DepartmentSummary, DepartmentDetail, DepartmentFormData } from "@/types";

const BASE = "/api/v1/manage/departments";

interface ListParams {
  root?: boolean;
  company_id?: string;
}

export async function listDepartments(params?: ListParams): Promise<DepartmentSummary[]> {
  const qs = new URLSearchParams();
  if (params?.root) qs.set("root", "true");
  if (params?.company_id) qs.set("company_id", params.company_id);
  const query = qs.toString();
  const data = await api.get<{ departments: DepartmentSummary[] }>(`${BASE}${query ? `?${query}` : ""}`);
  return data.departments;
}

export async function getDepartment(id: string): Promise<DepartmentDetail> {
  const data = await api.get<{ department: DepartmentDetail }>(`${BASE}/${id}`);
  return data.department;
}

export async function createDepartment(department: DepartmentFormData): Promise<DepartmentDetail> {
  const data = await api.post<{ department: DepartmentDetail }>(BASE, { department });
  return data.department;
}

export async function updateDepartment(id: string, department: Partial<DepartmentFormData>): Promise<DepartmentDetail> {
  const data = await api.put<{ department: DepartmentDetail }>(`${BASE}/${id}`, { department });
  return data.department;
}

export async function assignDepartmentHead(id: string, headEmployeeId: string | null): Promise<DepartmentDetail> {
  const data = await api.patch<{ department: DepartmentDetail }>(`${BASE}/${id}/assign_head`, {
    head_employee_id: headEmployeeId,
  });
  return data.department;
}

export async function deleteDepartment(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}
