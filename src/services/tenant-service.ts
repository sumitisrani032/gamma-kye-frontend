import { getMainDomainUrl } from "@/lib/tenant";
import type { TenantCheckResponse } from "@/types";

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
