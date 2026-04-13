"use client";

import { useState, useCallback } from "react";
import {
  createAttachment,
  deleteAttachment,
} from "@/services/attachment-service";
import type { Attachment, ApiError } from "@/types";

interface UseAttachmentsReturn {
  attachments: Attachment[];
  uploading: boolean;
  error: string;
  addAttachment: (
    file: File,
    attachableType: string,
    attachableId: string
  ) => Promise<Attachment | null>;
  removeAttachment: (id: string) => Promise<void>;
  clearError: () => void;
}

export function useAttachments(
  initial: Attachment[] = []
): UseAttachmentsReturn {
  const [attachments, setAttachments] = useState<Attachment[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const addAttachment = useCallback(
    async (
      file: File,
      attachableType: string,
      attachableId: string
    ): Promise<Attachment | null> => {
      setUploading(true);
      setError("");
      try {
        // For now, just create the metadata record.
        // S3 presigned URL upload will be added later.
        const attachment = await createAttachment({
          filename: file.name,
          content_type: file.type,
          byte_size: file.size,
          attachable_type: attachableType,
          attachable_id: attachableId,
        });
        setAttachments((prev) => [...prev, attachment]);
        return attachment;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.error || "Failed to upload file.");
        return null;
      } finally {
        setUploading(false);
      }
    },
    []
  );

  const removeAttachment = useCallback(async (id: string) => {
    try {
      await deleteAttachment(id);
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to delete file.");
    }
  }, []);

  const clearError = useCallback(() => setError(""), []);

  return {
    attachments,
    uploading,
    error,
    addAttachment,
    removeAttachment,
    clearError,
  };
}
