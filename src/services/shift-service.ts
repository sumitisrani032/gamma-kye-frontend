import { api } from "./api-client";
import type { Shift, ShiftFormData } from "@/types";

const BASE = "/api/v1/manage/shifts";

export async function listShifts(): Promise<Shift[]> {
  const data = await api.get<{ shifts: Shift[] }>(BASE);
  return data.shifts;
}

export async function createShift(shift: ShiftFormData): Promise<Shift> {
  const data = await api.post<{ shift: Shift }>(BASE, { shift });
  return data.shift;
}

export async function updateShift(id: string, shift: Partial<ShiftFormData>): Promise<Shift> {
  const data = await api.put<{ shift: Shift }>(`${BASE}/${id}`, { shift });
  return data.shift;
}

export async function deleteShift(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}
