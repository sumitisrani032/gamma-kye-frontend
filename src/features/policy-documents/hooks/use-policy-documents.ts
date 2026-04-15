"use client";

import { useState, useEffect, useCallback } from "react";
import { listManagedPolicies, getManagedPolicy, createPolicy, updatePolicy, publishPolicy, archivePolicy, deletePolicy, getAcknowledgementReport, sendReminder } from "@/services/policy-document-service";
import { createAttachment } from "@/services/attachment-service";
import type { PolicyDocument, PolicyDocumentFormData, AckReport, ApiError } from "@/types";

interface UsePolicyDocumentsReturn {
  policies: PolicyDocument[];
  selectedPolicy: PolicyDocument | null;
  ackReport: AckReport | null;
  loading: boolean;
  error: string;
  formError: string;
  refresh: () => Promise<void>;
  select: (id: string) => Promise<void>;
  clearSelection: () => void;
  add: (file: File, data: PolicyDocumentFormData) => Promise<boolean>;
  edit: (id: string, data: Partial<PolicyDocumentFormData>) => Promise<boolean>;
  publish: (id: string) => Promise<boolean>;
  archive: (id: string) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  loadReport: (id: string) => Promise<void>;
  remind: (id: string) => Promise<boolean>;
}

export function usePolicyDocuments(): UsePolicyDocumentsReturn {
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyDocument | null>(null);
  const [ackReport, setAckReport] = useState<AckReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    try {
      const data = await listManagedPolicies();
      setPolicies(data);
    } catch (err) { setError((err as ApiError).error || "Failed to load policies."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const select = useCallback(async (id: string) => {
    try {
      const data = await getManagedPolicy(id);
      setSelectedPolicy(data);
      setAckReport(null);
    } catch (err) { setError((err as ApiError).error || "Failed to load policy."); }
  }, []);

  const clearSelection = useCallback(() => { setSelectedPolicy(null); setAckReport(null); }, []);

  const add = useCallback(async (file: File, data: PolicyDocumentFormData): Promise<boolean> => {
    setFormError("");
    try {
      const att = await createAttachment({ attachment: { file_name: file.name, file_type: file.type, file_size: file.size, s3_key: `policies/${Date.now()}_${file.name}`, entity_type: "PolicyDocument", entity_id: "draft" } });
      await createPolicy(att.id, data);
      await refresh();
      return true;
    } catch (err) { setFormError((err as ApiError).error || "Failed to create policy."); return false; }
  }, [refresh]);

  const edit = useCallback(async (id: string, data: Partial<PolicyDocumentFormData>): Promise<boolean> => {
    setFormError("");
    try { await updatePolicy(id, data); await refresh(); if (selectedPolicy?.id === id) await select(id); return true; }
    catch (err) { setFormError((err as ApiError).error || "Failed to update."); return false; }
  }, [refresh, select, selectedPolicy]);

  const publish = useCallback(async (id: string): Promise<boolean> => {
    try { await publishPolicy(id); await refresh(); if (selectedPolicy?.id === id) await select(id); return true; }
    catch (err) { setError((err as ApiError).error || "Failed to publish."); return false; }
  }, [refresh, select, selectedPolicy]);

  const archive = useCallback(async (id: string): Promise<boolean> => {
    try { await archivePolicy(id); await refresh(); if (selectedPolicy?.id === id) await select(id); return true; }
    catch (err) { setError((err as ApiError).error || "Failed to archive."); return false; }
  }, [refresh, select, selectedPolicy]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try { await deletePolicy(id); await refresh(); if (selectedPolicy?.id === id) clearSelection(); return true; }
    catch (err) { setError((err as ApiError).error || "Failed to delete."); return false; }
  }, [refresh, clearSelection, selectedPolicy]);

  const loadReport = useCallback(async (id: string) => {
    try { const r = await getAcknowledgementReport(id); setAckReport(r); }
    catch (err) { setError((err as ApiError).error || "Failed to load report."); }
  }, []);

  const remind = useCallback(async (id: string): Promise<boolean> => {
    try { await sendReminder(id); return true; }
    catch (err) { setError((err as ApiError).error || "Failed to send reminders."); return false; }
  }, []);

  return { policies, selectedPolicy, ackReport, loading, error, formError, refresh, select, clearSelection, add, edit, publish, archive, remove, loadReport, remind };
}
