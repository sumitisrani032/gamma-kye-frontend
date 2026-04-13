"use client";

import { useRef } from "react";
import { Button, Alert } from "@/components/ui";
import type { Attachment } from "@/types";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

interface FileUploadProps {
  attachments: Attachment[];
  uploading: boolean;
  error: string;
  onUpload: (file: File) => void;
  onRemove: (id: string) => void;
  accept?: string;
}

export function FileUpload({
  attachments,
  uploading,
  error,
  onUpload,
  onRemove,
  accept,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      // Reset so the same file can be re-selected
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          loading={uploading}
          onClick={() => inputRef.current?.click()}
        >
          Choose File
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
        {uploading && (
          <span className="text-xs text-text-muted">Uploading...</span>
        )}
      </div>

      {attachments.length > 0 && (
        <ul className="space-y-2">
          {attachments.map((att) => (
            <li
              key={att.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileIcon className="h-4 w-4 text-text-muted shrink-0" />
                <span className="text-sm text-text-primary truncate">
                  {att.filename}
                </span>
                <span className="text-xs text-text-muted shrink-0">
                  {formatBytes(att.byte_size)}
                </span>
              </div>
              <button
                onClick={() => onRemove(att.id)}
                className="text-text-muted hover:text-danger transition-colors ml-2 shrink-0"
                title="Remove"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
