import { api } from "./api-client";
import type { BusinessUnit, BusinessUnitFormData } from "@/types";

const BASE = "/api/v1/manage/business_units";

export async function listBusinessUnits(): Promise<BusinessUnit[]> {
  const data = await api.get<{ business_units: BusinessUnit[] }>(BASE);
  return data.business_units;
}

export async function createBusinessUnit(business_unit: BusinessUnitFormData): Promise<BusinessUnit> {
  const data = await api.post<{ business_unit: BusinessUnit }>(BASE, { business_unit });
  return data.business_unit;
}

export async function updateBusinessUnit(id: string, business_unit: Partial<BusinessUnitFormData>): Promise<BusinessUnit> {
  const data = await api.put<{ business_unit: BusinessUnit }>(`${BASE}/${id}`, { business_unit });
  return data.business_unit;
}

export async function deleteBusinessUnit(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}
