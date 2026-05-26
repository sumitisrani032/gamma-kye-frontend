import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEmployeePayslip,
  createEmployeeSalary,
  createEmployeeSalaryComponent,
  createSalaryComponent,
  deleteEmployeePayslip,
  deleteEmployeeSalary,
  deleteEmployeeSalaryComponent,
  deleteSalaryComponent,
  generateEmployeePayslips,
  getEmployeePayslip,
  getEmployeeSalary,
  getSalaryComponent,
  listEmployeePayslips,
  listEmployeeSalaries,
  listEmployeeSalaryComponents,
  listSalaryComponents,
  updateEmployeePayslip,
  updateEmployeeSalary,
  updateSalaryComponent,
} from "@/services/payroll-service";
import type {
  EmployeePayslipData,
  EmployeeSalaryComponentData,
  EmployeeSalaryData,
  SalaryComponentData,
} from "@/types";

// ──────────────────────────────────────────────
// Keys
// ──────────────────────────────────────────────
const keys = {
  salaryComponents: (params?: Record<string, unknown>) => ["salary-components", params] as const,
  salaryComponent: (id: number) => ["salary-components", id] as const,
  employeeSalaries: (params?: Record<string, unknown>) => ["employee-salaries", params] as const,
  employeeSalary: (id: number) => ["employee-salaries", id] as const,
  employeePayslips: (params?: Record<string, unknown>) => ["employee-payslips", params] as const,
  employeePayslip: (id: number) => ["employee-payslips", id] as const,
};

// ──────────────────────────────────────────────
// Salary Components
// ──────────────────────────────────────────────
export function useSalaryComponentsList(params?: { is_active?: boolean; offset?: number; limit?: number }) {
  return useQuery({
    queryKey: keys.salaryComponents(params),
    queryFn: () => listSalaryComponents(params),
  });
}

export function useSalaryComponent(id: number) {
  return useQuery({
    queryKey: keys.salaryComponent(id),
    queryFn: () => getSalaryComponent(id),
    enabled: !!id,
  });
}

export function useCreateSalaryComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SalaryComponentData) => createSalaryComponent(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["salary-components"] }),
  });
}

export function useUpdateSalaryComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<SalaryComponentData> }) =>
      updateSalaryComponent(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["salary-components"] }),
  });
}

export function useDeleteSalaryComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSalaryComponent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["salary-components"] }),
  });
}

// ──────────────────────────────────────────────
// Employee Salaries
// ──────────────────────────────────────────────
export function useEmployeeSalariesList(params?: { employee_id?: string; offset?: number; limit?: number }) {
  return useQuery({
    queryKey: keys.employeeSalaries(params),
    queryFn: () => listEmployeeSalaries(params),
  });
}

export function useEmployeeSalary(id: number) {
  return useQuery({
    queryKey: keys.employeeSalary(id),
    queryFn: () => getEmployeeSalary(id),
    enabled: !!id,
  });
}

export function useCreateEmployeeSalary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: EmployeeSalaryData) => createEmployeeSalary(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employee-salaries"] }),
  });
}

export function useUpdateEmployeeSalary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<EmployeeSalaryData> }) =>
      updateEmployeeSalary(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employee-salaries"] }),
  });
}

export function useDeleteEmployeeSalary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteEmployeeSalary(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employee-salaries"] }),
  });
}

// ──────────────────────────────────────────────
// Employee Salary Components (link table)
// ──────────────────────────────────────────────
export function useEmployeeSalaryComponentsList(params?: {
  employee_salary_id?: number; salary_component_id?: number; offset?: number; limit?: number;
}) {
  return useQuery({
    queryKey: ["employee-salary-components", params],
    queryFn: () => listEmployeeSalaryComponents(params),
  });
}

export function useCreateEmployeeSalaryComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: EmployeeSalaryComponentData) => createEmployeeSalaryComponent(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employee-salary-components"] }),
  });
}

export function useDeleteEmployeeSalaryComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteEmployeeSalaryComponent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employee-salary-components"] }),
  });
}

// ──────────────────────────────────────────────
// Employee Payslips
// ──────────────────────────────────────────────
export function useEmployeePayslipsList(params?: {
  employee_id?: string; employee_salary_id?: number; year?: number; month?: number; offset?: number; limit?: number;
}) {
  return useQuery({
    queryKey: keys.employeePayslips(params),
    queryFn: () => listEmployeePayslips(params),
  });
}

export function useEmployeePayslip(id: number) {
  return useQuery({
    queryKey: keys.employeePayslip(id),
    queryFn: () => getEmployeePayslip(id),
    enabled: !!id,
  });
}

export function useGenerateEmployeePayslips() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { month: number; year: number }) => generateEmployeePayslips(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employee-payslips"] }),
  });
}

export function useCreateEmployeePayslip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: EmployeePayslipData) => createEmployeePayslip(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employee-payslips"] }),
  });
}

export function useUpdateEmployeePayslip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<EmployeePayslipData> }) =>
      updateEmployeePayslip(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employee-payslips"] }),
  });
}

export function useDeleteEmployeePayslip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteEmployeePayslip(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employee-payslips"] }),
  });
}
