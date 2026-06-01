import { api } from "./api-client";
import type {
  EmployeeSalary,
  EmployeeSalaryComponent,
  EmployeeSalaryComponentData,
  EmployeeSalaryComponentListResult,
  EmployeeSalaryData,
  EmployeeSalaryListResult,
  EmployeePayslip,
  EmployeePayslipData,
  EmployeePayslipListResult,
  SalaryComponent,
  SalaryComponentData,
  SalaryComponentListResult,
} from "@/types";

// ──────────────────────────────────────────────
// Salary Components Master
// ──────────────────────────────────────────────
const SC_BASE = "/api/v1/payroll/salary-components";

export async function listSalaryComponents(
  params?: { is_active?: boolean; offset?: number; limit?: number },
): Promise<SalaryComponentListResult> {
  const qs = new URLSearchParams();
  if (params?.is_active !== undefined) qs.set("is_active", String(params.is_active));
  if (params?.offset !== undefined) qs.set("offset", String(params.offset));
  if (params?.limit !== undefined) qs.set("limit", String(params.limit));
  const query = qs.toString();
  return api.get<SalaryComponentListResult>(`${SC_BASE}${query ? `?${query}` : ""}`);
}

export async function getSalaryComponent(id: number): Promise<SalaryComponent> {
  return api.get<SalaryComponent>(`${SC_BASE}/${id}`);
}

export async function createSalaryComponent(payload: SalaryComponentData): Promise<SalaryComponent> {
  return api.post<SalaryComponent>(SC_BASE, payload);
}

export async function updateSalaryComponent(id: number, payload: Partial<SalaryComponentData>): Promise<SalaryComponent> {
  return api.patch<SalaryComponent>(`${SC_BASE}/${id}`, payload);
}

export async function deleteSalaryComponent(id: number): Promise<void> {
  await api.delete(`${SC_BASE}/${id}`);
}

// ──────────────────────────────────────────────
// Employee Salaries
// ──────────────────────────────────────────────
const ES_BASE = "/api/v1/payroll/employee-salaries";

export async function listEmployeeSalaries(
  params?: { employee_id?: string; search?: string; offset?: number; limit?: number },
): Promise<EmployeeSalaryListResult> {
  const qs = new URLSearchParams();
  if (params?.employee_id) qs.set("employee_id", params.employee_id);
  if (params?.search) qs.set("search", params.search);
  if (params?.offset !== undefined) qs.set("offset", String(params.offset));
  if (params?.limit !== undefined) qs.set("limit", String(params.limit));
  const query = qs.toString();
  return api.get<EmployeeSalaryListResult>(`${ES_BASE}${query ? `?${query}` : ""}`);
}

export async function getEmployeeSalary(id: number): Promise<EmployeeSalary> {
  return api.get<EmployeeSalary>(`${ES_BASE}/${id}`);
}

export async function createEmployeeSalary(payload: EmployeeSalaryData): Promise<EmployeeSalary> {
  return api.post<EmployeeSalary>(ES_BASE, payload);
}

export async function updateEmployeeSalary(id: number, payload: Partial<EmployeeSalaryData>): Promise<EmployeeSalary> {
  return api.patch<EmployeeSalary>(`${ES_BASE}/${id}`, payload);
}

export async function deleteEmployeeSalary(id: number): Promise<void> {
  await api.delete(`${ES_BASE}/${id}`);
}

// ──────────────────────────────────────────────
// Employee Payslips
// ──────────────────────────────────────────────
const EP_BASE = "/api/v1/payroll/employee-payslips";

export async function listEmployeePayslips(
  params?: { employee_id?: string; employee_salary_id?: number; year?: number; month?: number; offset?: number; limit?: number },
): Promise<EmployeePayslipListResult> {
  const qs = new URLSearchParams();
  if (params?.employee_id) qs.set("employee_id", params.employee_id);
  if (params?.employee_salary_id !== undefined) qs.set("employee_salary_id", String(params.employee_salary_id));
  if (params?.year !== undefined) qs.set("year", String(params.year));
  if (params?.month !== undefined) qs.set("month", String(params.month));
  if (params?.offset !== undefined) qs.set("offset", String(params.offset));
  if (params?.limit !== undefined) qs.set("limit", String(params.limit));
  const query = qs.toString();
  return api.get<EmployeePayslipListResult>(`${EP_BASE}${query ? `?${query}` : ""}`);
}

export async function getEmployeePayslip(id: number): Promise<EmployeePayslip> {
  return api.get<EmployeePayslip>(`${EP_BASE}/${id}`);
}

export async function createEmployeePayslip(payload: EmployeePayslipData): Promise<EmployeePayslip> {
  return api.post<EmployeePayslip>(EP_BASE, payload);
}

export async function updateEmployeePayslip(id: number, payload: Partial<EmployeePayslipData>): Promise<EmployeePayslip> {
  return api.patch<EmployeePayslip>(`${EP_BASE}/${id}`, payload);
}

export async function deleteEmployeePayslip(id: number): Promise<void> {
  await api.delete(`${EP_BASE}/${id}`);
}

export async function generateEmployeePayslips(payload: { month: number; year: number }): Promise<{
  items: { employee_id: string; employee_name: string | null; status: string; message: string | null }[];
  total_requested: number;
  total_created: number;
  total_skipped: number;
  total_failed: number;
}> {
  return api.post(`${EP_BASE}/generate`, payload);
}

// ──────────────────────────────────────────────
// Employee Salary Components (link table)
// ──────────────────────────────────────────────
const ESC_BASE = "/api/v1/payroll/employee-salary-components";

export async function listEmployeeSalaryComponents(
  params?: {
    employee_salary_id?: number;
    salary_component_id?: number;
    offset?: number;
    limit?: number;
  },
): Promise<EmployeeSalaryComponentListResult> {
  const qs = new URLSearchParams();
  if (params?.employee_salary_id !== undefined) qs.set("employee_salary_id", String(params.employee_salary_id));
  if (params?.salary_component_id !== undefined) qs.set("salary_component_id", String(params.salary_component_id));
  if (params?.offset !== undefined) qs.set("offset", String(params.offset));
  if (params?.limit !== undefined) qs.set("limit", String(params.limit));
  const query = qs.toString();
  return api.get<EmployeeSalaryComponentListResult>(`${ESC_BASE}${query ? `?${query}` : ""}`);
}

export async function createEmployeeSalaryComponent(
  payload: EmployeeSalaryComponentData,
): Promise<EmployeeSalaryComponent> {
  return api.post<EmployeeSalaryComponent>(ESC_BASE, payload);
}

export async function deleteEmployeeSalaryComponent(id: number): Promise<void> {
  await api.delete(`${ESC_BASE}/${id}`);
}
