import { api } from "./api-client";
import type { AuditLog, AuditLogFilters, PaginatedList } from "@/types";

export async function getAuditLogs(
  filters?: AuditLogFilters
): Promise<PaginatedList<AuditLog>> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      }
    });
  }
  const qs = params.toString();
  return api.get<PaginatedList<AuditLog>>(
    `/api/v1/manage/audit_logs${qs ? `?${qs}` : ""}`
  );
}

export async function getAuditLog(id: string): Promise<AuditLog> {
  return api.get<AuditLog>(`/api/v1/manage/audit_logs/${id}`);
}
