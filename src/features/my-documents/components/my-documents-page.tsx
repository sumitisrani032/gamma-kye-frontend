"use client";

import { useState, useRef } from "react";
import { Button, Card, CardContent, CardHeader, Input, Alert } from "@/components/ui";
import { useMyDocuments } from "../hooks/use-my-documents";
import type { RequirementWithStatus } from "@/types";

const STATUS_STYLES: Record<string, string> = {
  verified: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  rejected: "bg-red-100 text-red-700",
  missing: "bg-surface-tertiary text-text-muted",
};

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

/* ─── Upload Form ─── */

function UploadForm({ requirement, onUpload, onReupload, uploading, onCancel }: {
  requirement: RequirementWithStatus;
  onUpload: (reqId: string, file: File, name: string, expiry?: string) => Promise<boolean>;
  onReupload: (docId: string, file: File, name?: string) => Promise<boolean>;
  uploading: boolean;
  onCancel: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [docName, setDocName] = useState(requirement.requirement.name);
  const [expiry, setExpiry] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isReupload = requirement.status === "rejected" && requirement.submission;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    let ok: boolean;
    if (isReupload && requirement.submission) {
      ok = await onReupload(requirement.submission.id, file, docName);
    } else {
      ok = await onUpload(requirement.requirement.id, file, docName, expiry || undefined);
    }
    if (ok) onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-surface-secondary rounded-lg p-4 mt-2">
      <p className="text-xs text-text-muted">{isReupload ? "Re-upload" : "Upload"} {requirement.requirement.name}</p>
      <Input label="Document Name" value={docName} onChange={(e) => setDocName(e.target.value)} required />
      {requirement.requirement.has_expiry && (
        <Input label="Expiry Date" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
      )}
      <div className="flex items-center gap-3">
        <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
          {file ? file.name : "Choose File"}
        </Button>
        <input ref={inputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        {file && <span className="text-xs text-text-muted">{formatBytes(file.size)}</span>}
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={uploading} disabled={!file}>{isReupload ? "Re-upload" : "Upload"}</Button>
        <Button type="button" size="sm" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

/* ─── Requirement Row ─── */

function RequirementRow({ req, onUpload, onReupload, uploading }: {
  req: RequirementWithStatus;
  onUpload: (reqId: string, file: File, name: string, expiry?: string) => Promise<boolean>;
  onReupload: (docId: string, file: File, name?: string) => Promise<boolean>;
  uploading: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const canUpload = req.status === "missing" || req.status === "rejected";

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-text-primary">{req.requirement.name}</p>
            {req.requirement.is_mandatory && <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-red-100 text-red-700">Required</span>}
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_STYLES[req.status]}`}>{req.status}</span>
          </div>
          {req.submission && (
            <div className="text-xs text-text-muted mt-1">
              {req.submission.attachment && <span>{req.submission.attachment.file_name} ({formatBytes(req.submission.attachment.file_size)})</span>}
              {!req.submission.attachment && <span>{req.submission.document_name}</span>}
              {req.submission.verified_at && <span> · Verified {new Date(req.submission.verified_at).toLocaleDateString()}</span>}
            </div>
          )}
          {req.status === "rejected" && req.submission?.rejection_reason && (
            <p className="text-xs text-red-600 mt-1">Rejection reason: {req.submission.rejection_reason}</p>
          )}
        </div>
        {canUpload && (
          <Button size="sm" variant={req.status === "rejected" ? "danger" : "primary"} onClick={() => setShowForm(!showForm)}>
            {req.status === "rejected" ? "Re-upload" : "Upload"}
          </Button>
        )}
      </div>
      {showForm && (
        <UploadForm requirement={req} onUpload={onUpload} onReupload={onReupload} uploading={uploading} onCancel={() => setShowForm(false)} />
      )}
    </div>
  );
}

/* ─── Main Page ─── */

export function MyDocumentsPage() {
  const { requirements, documents, loading, error, formError, uploading, upload, reupload } = useMyDocuments();

  if (loading) {
    return <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  }

  const missing = requirements.filter((r) => r.status === "missing");
  const rejected = requirements.filter((r) => r.status === "rejected");
  const pending = requirements.filter((r) => r.status === "pending");
  const verified = requirements.filter((r) => r.status === "verified");

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}
      {formError && <Alert variant="error">{formError}</Alert>}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Missing", count: missing.length, color: "text-red-600" },
          { label: "Rejected", count: rejected.length, color: "text-red-600" },
          { label: "Pending", count: pending.length, color: "text-yellow-600" },
          { label: "Verified", count: verified.length, color: "text-green-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="py-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-text-muted">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Requirements Checklist */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">Required Documents ({requirements.length})</h3>
        </CardHeader>
        {requirements.length > 0 ? (
          <div className="divide-y divide-border">
            {requirements.map((r) => (
              <RequirementRow key={r.requirement.id} req={r} onUpload={upload} onReupload={reupload} uploading={uploading} />
            ))}
          </div>
        ) : (
          <CardContent>
            <p className="text-sm text-text-muted text-center py-4">No document requirements assigned.</p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
