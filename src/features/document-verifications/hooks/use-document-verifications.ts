"use client";

import { useState, useEffect, useCallback } from "react";
import { listVerifications, verifyDocument, rejectDocument } from "@/services/employee-document-service";
import type { EmployeeDocument, ApiError } from "@/types";

interface UseDocumentVerificationsReturn {
  documents: EmployeeDocument[];
  loading: boolean;
  error: string;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  refresh: () => Promise<void>;
  verify: (id: string) => Promise<boolean>;
  reject: (id: string, reason: string) => Promise<boolean>;
}

export function useDocumentVerifications(): UseDocumentVerificationsReturn {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");

  const refresh = useCallback(async () => {
    setError("");
    try {
      const data = await listVerifications({ status: statusFilter || undefined });
      setDocuments(data);
    } catch (err) {
      setError((err as ApiError).error || "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { refresh(); }, [refresh]);

  const verify = useCallback(async (id: string): Promise<boolean> => {
    try { await verifyDocument(id); await refresh(); return true; }
    catch (err) { setError((err as ApiError).error || "Failed to verify."); return false; }
  }, [refresh]);

  const reject = useCallback(async (id: string, reason: string): Promise<boolean> => {
    try { await rejectDocument(id, reason); await refresh(); return true; }
    catch (err) { setError((err as ApiError).error || "Failed to reject."); return false; }
  }, [refresh]);

  return { documents, loading, error, statusFilter, setStatusFilter, refresh, verify, reject };
}
