import { api } from "./api-client";
import type { CompanySummary, CompanyDetail, CompanyFormData } from "@/types";

const BASE = "/api/v1/manage/companies";

export async function listCompanies(): Promise<CompanySummary[]> {
  const data = await api.get<{ companies: CompanySummary[] }>(BASE);
  return data.companies;
}

export async function getCompany(id: string): Promise<CompanyDetail> {
  const data = await api.get<{ company: CompanyDetail }>(`${BASE}/${id}`);
  return data.company;
}

export async function createCompany(company: CompanyFormData): Promise<CompanyDetail> {
  const data = await api.post<{ company: CompanyDetail }>(BASE, { company });
  return data.company;
}

export async function updateCompany(id: string, company: Partial<CompanyFormData>): Promise<CompanyDetail> {
  const data = await api.put<{ company: CompanyDetail }>(`${BASE}/${id}`, { company });
  return data.company;
}

export async function deleteCompany(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}
