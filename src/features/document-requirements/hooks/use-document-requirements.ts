"use client";

import { useState, useEffect, useCallback } from "react";
import { listDocumentRequirements, createDocumentRequirement, updateDocumentRequirement, deleteDocumentRequirement } from "@/services/document-requirement-service";
import type { DocumentRequirement, DocumentRequirementFormData, ApiError } from "@/types";

interface UseDocumentRequirementsReturn {
  requirements: DocumentRequirement[];
  loading: boolean;
  error: string;
  formError: string;
  refresh: () => Promise<void>;
  add: (data: DocumentRequirementFormData) => Promise<boolean>;
  update: (id: string, data: Partial<DocumentRequirementFormData>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  clearFormErrors: () => void;
}

export function useDocumentRequirements(): UseDocumentRequirementsReturn {
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const clearFormErrors = useCallback(() => setFormError(""), []);

  const refresh = useCallback(async () => {
    setError("");
    try {
      const data = await listDocumentRequirements();
      setRequirements(data);
    } catch (err) {
      setError((err as ApiError).error || "Failed to load document requirements.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(async (data: DocumentRequirementFormData): Promise<boolean> => {
    setFormError("");
    try { await createDocumentRequirement(data); await refresh(); return true; }
    catch (err) { setFormError((err as ApiError).error || "Failed to create."); return false; }
  }, [refresh]);

  const update = useCallback(async (id: string, data: Partial<DocumentRequirementFormData>): Promise<boolean> => {
    setFormError("");
    try { await updateDocumentRequirement(id, data); await refresh(); return true; }
    catch (err) { setFormError((err as ApiError).error || "Failed to update."); return false; }
  }, [refresh]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try { await deleteDocumentRequirement(id); await refresh(); return true; }
    catch (err) { setError((err as ApiError).error || "Failed to delete."); return false; }
  }, [refresh]);

  return { requirements, loading, error, formError, refresh, add, update, remove, clearFormErrors };
}
