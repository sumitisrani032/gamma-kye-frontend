import { api } from "./api-client";
import type { ShiftAssignment, ShiftAssignmentFormData } from "@/types";

const BASE = "/api/v1/manage/shift_assignments";

interface ListParams {
  employee_id?: string;
  shift_id?: string;
  active?: boolean;
}

export async function listShiftAssignments(params?: ListParams): Promise<ShiftAssignment[]> {
  const qs = new URLSearchParams();
  if (params?.employee_id) qs.set("employee_id", params.employee_id);
  if (params?.shift_id) qs.set("shift_id", params.shift_id);
  if (params?.active !== undefined) qs.set("active", String(params.active));
  const query = qs.toString();
  const data = await api.get<{ shift_assignments: ShiftAssignment[] }>(`${BASE}${query ? `?${query}` : ""}`);
  return data.shift_assignments;
}

export async function createShiftAssignment(payload: ShiftAssignmentFormData): Promise<ShiftAssignment> {
  const data = await api.post<{ shift_assignment: ShiftAssignment }>(BASE, { shift_assignment: payload });
  return data.shift_assignment;
}

export async function updateShiftAssignment(id: string, payload: Partial<ShiftAssignmentFormData>): Promise<ShiftAssignment> {
  const data = await api.put<{ shift_assignment: ShiftAssignment }>(`${BASE}/${id}`, { shift_assignment: payload });
  return data.shift_assignment;
}

export async function deleteShiftAssignment(id: string): Promise<void> {
  await api.delete<void>(`${BASE}/${id}`);
}

/** Get the currently active shift for an employee. */
export async function getEmployeeActiveShift(employeeId: string): Promise<ShiftAssignment | null> {
  const assignments = await listShiftAssignments({ employee_id: employeeId, active: true });
  return assignments[0] || null;
}
