import { api } from "./api-client";
import { getMainDomainUrl } from "@/lib/tenant";
import type {
  TenantCheckResponse,
  SetupStatusResponse,
  CompleteSetupResponse,
} from "@/types";

export async function checkTenant(subdomain: string): Promise<TenantCheckResponse> {
  const baseUrl = getMainDomainUrl();
  const response = await fetch(
    `${baseUrl}/api/v1/tenant/check?subdomain=${encodeURIComponent(subdomain)}`
  );
  const data = await response.json();
  if (!response.ok) {
    throw { status: response.status, ...data };
  }
  return data as TenantCheckResponse;
}

export async function getSetupStatus(): Promise<SetupStatusResponse> {
  return api.get<SetupStatusResponse>("/api/v1/tenant/setup_status");
}

export async function completeSetup(): Promise<CompleteSetupResponse> {
  return api.post<CompleteSetupResponse>("/api/v1/tenant/complete_setup");
}
