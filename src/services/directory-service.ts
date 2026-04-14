import { api } from "./api-client";
import type { DirectoryEmployee, EmployeeDetail } from "@/types";

const BASE = "/api/v1/employees";

export async function listDirectory(departmentId?: string): Promise<DirectoryEmployee[]> {
  const query = departmentId ? `?department_id=${departmentId}` : "";
  const data = await api.get<{ employees: DirectoryEmployee[] }>(`${BASE}${query}`);
  return data.employees;
}

export async function getDirectoryEmployee(id: string): Promise<EmployeeDetail> {
  const data = await api.get<{ employee: EmployeeDetail }>(`${BASE}/${id}`);
  return data.employee;
}
