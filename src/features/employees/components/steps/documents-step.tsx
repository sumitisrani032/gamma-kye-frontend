"use client";

import { useState, useCallback, useRef } from "react";
import { Button, Alert } from "@/components/ui";
import type { OnboardWizardState } from "../../types/onboard";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

interface DocumentsStepProps {
  state: OnboardWizardState;
  updateFields: (fields: Partial<OnboardWizardState>) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsStep({ state, updateFields }: DocumentsStepProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles?.length) return;

    setError("");
    setUploading(true);

    try {
      const newFiles: UploadedFile[] = [];

      for (const file of Array.from(selectedFiles)) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          setError(`${file.name} exceeds 10MB limit.`);
          continue;
        }

        // In production, this would upload to S3 and get back a key.
        // For now, track the file metadata — actual upload happens via the attachment service.
        const fileRef: UploadedFile = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: file.name,
          size: file.size,
          type: file.type,
        };
        newFiles.push(fileRef);
      }

      setFiles((prev) => [...prev, ...newFiles]);
      updateFields({ documentIds: [...state.documentIds, ...newFiles.map((f) => f.id)] });
    } catch {
      setError("Failed to process files.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [state.documentIds, updateFields]);

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    updateFields({ documentIds: state.documentIds.filter((id) => id !== fileId) });
  }, [state.documentIds, updateFields]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-primary">Documents</h3>
        <p className="text-sm text-text-secondary mt-1">
          Upload onboarding documents (ID proof, offer letter, etc.). This step is optional — documents can also be uploaded later.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Upload area */}
      <div
        className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary-300 transition-colors cursor-pointer"
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        />
        <div className="text-text-muted space-y-2">
          <svg className="mx-auto h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
          </svg>
          <p className="text-sm font-medium text-text-primary">Click to upload or drag files here</p>
          <p className="text-xs">PDF, DOC, JPG, PNG up to 10MB each</p>
        </div>
      </div>

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600" />
          Processing...
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <svg className="h-5 w-5 text-text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <div className="min-w-0">
                  <p className="text-sm text-text-primary truncate">{file.name}</p>
                  <p className="text-xs text-text-muted">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="text-danger shrink-0" onClick={() => removeFile(file.id)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
