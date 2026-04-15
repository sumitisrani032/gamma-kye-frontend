"use client";

import { useState, useEffect, useCallback } from "react";
import { getMyRequirements, listMyDocuments, uploadMyDocument, reuploadMyDocument, deleteMyDocument } from "@/services/employee-document-service";
import { createAttachment } from "@/services/attachment-service";
import type { RequirementWithStatus, EmployeeDocument, ApiError } from "@/types";

interface UseMyDocumentsReturn {
  requirements: RequirementWithStatus[];
  documents: EmployeeDocument[];
  loading: boolean;
  error: string;
  formError: string;
  uploading: boolean;
  refresh: () => Promise<void>;
  upload: (requirementId: string, file: File, docName: string, expiresAt?: string) => Promise<boolean>;
  reupload: (docId: string, file: File, docName?: string) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
}

export function useMyDocuments(): UseMyDocumentsReturn {
  const [requirements, setRequirements] = useState<RequirementWithStatus[]>([]);
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [uploading, setUploading] = useState(false);

  const refresh = useCallback(async () => {
    setError("");
    try {
      const [reqs, docs] = await Promise.all([getMyRequirements(), listMyDocuments()]);
      setRequirements(reqs);
      setDocuments(docs);
    } catch (err) {
      setError((err as ApiError).error || "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const upload = useCallback(async (requirementId: string, file: File, docName: string, expiresAt?: string): Promise<boolean> => {
    setUploading(true);
    setFormError("");
    try {
      const att = await createAttachment({
        attachment: { file_name: file.name, file_type: file.type, file_size: file.size, s3_key: `documents/${Date.now()}_${file.name}`, entity_type: "EmployeeDocument", entity_id: requirementId },
      });
      await uploadMyDocument({ document_requirement_id: requirementId, attachment_id: att.id, document_name: docName, expires_at: expiresAt });
      await refresh();
      return true;
    } catch (err) {
      setFormError((err as ApiError).error || "Failed to upload document.");
      return false;
    } finally {
      setUploading(false);
    }
  }, [refresh]);

  const reupload = useCallback(async (docId: string, file: File, docName?: string): Promise<boolean> => {
    setUploading(true);
    setFormError("");
    try {
      const att = await createAttachment({
        attachment: { file_name: file.name, file_type: file.type, file_size: file.size, s3_key: `documents/${Date.now()}_${file.name}`, entity_type: "EmployeeDocument", entity_id: docId },
      });
      await reuploadMyDocument(docId, { attachment_id: att.id, document_name: docName });
      await refresh();
      return true;
    } catch (err) {
      setFormError((err as ApiError).error || "Failed to re-upload document.");
      return false;
    } finally {
      setUploading(false);
    }
  }, [refresh]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try { await deleteMyDocument(id); await refresh(); return true; }
    catch (err) { setError((err as ApiError).error || "Failed to delete."); return false; }
  }, [refresh]);

  return { requirements, documents, loading, error, formError, uploading, refresh, upload, reupload, remove };
}
