import { api } from "./api-client";
import type {
  EmployeeListItem,
  EmployeeDetail,
  EmployeeOnboardData,
  Pagination,
  PaginatedListParams,
  PromoteData,
  TransferData,
  OffboardData,
} from "@/types";

const BASE = "/api/v1/manage/employees";

interface ListParams extends PaginatedListParams {
  active?: boolean;
  department_id?: string;
}

export interface ListEmployeesResult {
  employees: EmployeeListItem[];
  pagination?: Pagination;
}

/**
 * Non-paginated variant kept for callers that just want the list.
 * Backend default per_page is 25 — use `listEmployeesPaginated` if that matters.
 */
export async function listEmployees(params?: ListParams): Promise<EmployeeListItem[]> {
  const { employees } = await listEmployeesPaginated(params);
  return employees;
}

export async function listEmployeesPaginated(params?: ListParams): Promise<ListEmployeesResult> {
  const qs = new URLSearchParams();
  if (params?.active !== undefined) qs.set("active", String(params.active));
  if (params?.department_id) qs.set("department_id", params.department_id);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.per_page) qs.set("per_page", String(params.per_page));
  const query = qs.toString();
  const data = await api.get<{ employees: EmployeeListItem[]; pagination?: Pagination }>(
    `${BASE}${query ? `?${query}` : ""}`,
  );
  return { employees: data.employees, pagination: data.pagination };
}

export async function getEmployee(id: string): Promise<EmployeeDetail> {
  const data = await api.get<{ employee: EmployeeDetail }>(`${BASE}/${id}`);
  return data.employee;
}

export async function onboardEmployee(payload: EmployeeOnboardData): Promise<EmployeeDetail> {
  const data = await api.post<{ employee: EmployeeDetail }>(BASE, payload);
  return data.employee;
}

export async function updateEmployee(id: string, employee: Record<string, unknown>): Promise<EmployeeDetail> {
  const data = await api.put<{ employee: EmployeeDetail }>(`${BASE}/${id}`, { employee });
  return data.employee;
}

export async function promoteEmployee(id: string, payload: PromoteData): Promise<EmployeeDetail> {
  const data = await api.post<{ employee: EmployeeDetail }>(`${BASE}/${id}/promote`, payload);
  return data.employee;
}

export async function transferEmployee(id: string, payload: TransferData): Promise<EmployeeDetail> {
  const data = await api.post<{ employee: EmployeeDetail }>(`${BASE}/${id}/transfer`, payload);
  return data.employee;
}

export async function changeManager(id: string, reportingManagerId: string, effectiveDate: string): Promise<EmployeeDetail> {
  const data = await api.post<{ employee: EmployeeDetail }>(`${BASE}/${id}/change_manager`, {
    reporting_manager_id: reportingManagerId,
    effective_date: effectiveDate,
  });
  return data.employee;
}

export async function offboardEmployee(id: string, payload: OffboardData): Promise<EmployeeDetail> {
  const data = await api.post<{ employee: EmployeeDetail }>(`${BASE}/${id}/offboard`, payload);
  return data.employee;
}

export async function assignRole(id: string, roleId: string): Promise<EmployeeDetail> {
  const data = await api.post<{ employee: EmployeeDetail }>(`${BASE}/${id}/assign_role`, { role_id: roleId });
  return data.employee;
}

export async function removeRole(id: string, roleId: string): Promise<void> {
  await api.delete(`${BASE}/${id}/remove_role`, { role_id: roleId });
}

export async function updateAccount(id: string, status: string): Promise<EmployeeDetail> {
  const data = await api.patch<{ employee: EmployeeDetail }>(`${BASE}/${id}/update_account`, { status });
  return data.employee;
}

export async function setPassword(id: string, password: string, passwordConfirmation: string): Promise<void> {
  await api.post(`${BASE}/${id}/set_password`, { password, password_confirmation: passwordConfirmation });
}
