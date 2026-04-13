import { api } from "./api-client";
import type { AuditLog, AuditLogFilters } from "@/types";

interface AuditLogListResponse {
  audit_logs: AuditLog[];
  total: number;
}

interface AuditLogResponse {
  audit_log: AuditLog;
}

export async function getAuditLogs(
  filters?: AuditLogFilters
): Promise<AuditLogListResponse> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      }
    });
  }
  const qs = params.toString();
  return api.get<AuditLogListResponse>(
    `/api/v1/manage/audit_logs${qs ? `?${qs}` : ""}`
  );
}

export async function getAuditLog(id: string): Promise<AuditLog> {
  const { audit_log } = await api.get<AuditLogResponse>(
    `/api/v1/manage/audit_logs/${id}`
  );
  return audit_log;
}
