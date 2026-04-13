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
  addAttachment: (file: File, s3Key: string) => Promise<Attachment | null>;
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
    async (file: File, s3Key: string): Promise<Attachment | null> => {
      setUploading(true);
      setError("");
      try {
        const attachment = await createAttachment({
          attachment: {
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            s3_key: s3Key,
          },
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
