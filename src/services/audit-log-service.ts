import { api } from "./api-client";
import type { AuditLog, AuditLogFilters, Pagination } from "@/types";

interface RawAuditLogListResponse {
  audit_logs: AuditLog[];
  // New shape (matches every other paginated endpoint).
  pagination?: Pagination;
  // Old shape — kept for transitional compatibility.
  total?: number;
}

export interface AuditLogListResponse {
  audit_logs: AuditLog[];
  total: number;
  pagination?: Pagination;
}

interface AuditLogResponse {
  audit_log: AuditLog;
}

export async function getAuditLogs(
  filters?: AuditLogFilters,
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
  const raw = await api.get<RawAuditLogListResponse>(
    `/api/v1/manage/audit_logs${qs ? `?${qs}` : ""}`,
  );
  const total = raw.pagination?.total ?? raw.total ?? raw.audit_logs.length;
  return { audit_logs: raw.audit_logs, total, pagination: raw.pagination };
}

export async function getAuditLog(id: string): Promise<AuditLog> {
  const { audit_log } = await api.get<AuditLogResponse>(
    `/api/v1/manage/audit_logs/${id}`,
  );
  return audit_log;
}
