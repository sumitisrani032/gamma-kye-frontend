"use client";

import { useState, useEffect, useCallback } from "react";
import { getAuditLogs } from "@/services/audit-log-service";
import type { AuditLog, AuditLogFilters } from "@/types";

const PAGE_SIZE = 25;

interface UseAuditLogsReturn {
  logs: AuditLog[];
  total: number;
  loading: boolean;
  error: string;
  filters: AuditLogFilters;
  setFilters: (filters: AuditLogFilters) => void;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
}

export function useAuditLogs(): UseAuditLogsReturn {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [page, setPage] = useState(1);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAuditLogs({
        ...filters,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });
      setLogs(data.audit_logs);
      setTotal(data.total);
    } catch {
      setError("Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  return {
    logs,
    total,
    loading,
    error,
    filters,
    setFilters: (f: AuditLogFilters) => {
      setFilters(f);
      setPage(1);
    },
    page,
    setPage,
    totalPages,
  };
}
