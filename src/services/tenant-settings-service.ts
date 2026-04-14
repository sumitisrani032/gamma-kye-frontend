import { api } from "./api-client";
import type { TenantSettings } from "@/types";

const BASE = "/api/v1/manage/tenant_settings";

interface SettingsResponse {
  settings: TenantSettings;
}

interface UpdateSettingsResponse {
  message: string;
  settings: TenantSettings;
}

export async function getTenantSettings(): Promise<TenantSettings> {
  const data = await api.get<SettingsResponse>(BASE);
  return data.settings;
}

export async function updateTenantSettings(
  settings: Partial<TenantSettings>
): Promise<TenantSettings> {
  const data = await api.patch<UpdateSettingsResponse>(BASE, { settings });
  return data.settings;
}
