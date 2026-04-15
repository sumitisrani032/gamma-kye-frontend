"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, Select, Input, Alert } from "@/components/ui";
import { useDocumentVerifications } from "../hooks/use-document-verifications";
import type { EmployeeDocument } from "@/types";

const STATUS_OPTIONS = [
  { value: "", label: "All" }, { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" }, { value: "rejected", label: "Rejected" },
];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  verified: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
}

function VerificationRow({ doc, onVerify, onReject }: {
  doc: EmployeeDocument; onVerify: (id: string) => Promise<boolean>; onReject: (id: string, reason: string) => Promise<boolean>;
}) {
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [acting, setActing] = useState(false);

  const handleVerify = async () => {
    setActing(true);
    await onVerify(doc.id);
    setActing(false);
  };

  const handleReject = async () => {
    if (!reason.trim()) return;
    setActing(true);
    const ok = await onReject(doc.id, reason.trim());
    setActing(false);
    if (ok) setShowReject(false);
  };

  return (
    <>
      <tr className="hover:bg-surface-secondary/50">
        <td className="px-4 py-3">
          <p className="text-sm font-medium text-text-primary">{doc.employee?.full_name || "—"}</p>
          <p className="text-[10px] text-text-muted">{doc.employee?.department?.name || "—"} · {doc.employee?.designation?.name || "—"}</p>
        </td>
        <td className="px-4 py-3">
          <p className="text-sm text-text-primary">{doc.document_name}</p>
          <p className="text-[10px] text-text-muted capitalize">{doc.document_type.replace("_", " ")}</p>
        </td>
        <td className="px-4 py-3 text-xs text-text-secondary">{doc.attachment?.file_name || "—"}</td>
        <td className="px-4 py-3 text-xs text-text-secondary">{formatDate(doc.created_at)}</td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_STYLES[doc.status]}`}>{doc.status}</span>
        </td>
        <td className="px-4 py-3 text-right">
          {doc.status === "pending" && (
            <div className="flex items-center justify-end gap-1">
              <Button size="sm" loading={acting} onClick={handleVerify}>Verify</Button>
              <Button size="sm" variant="ghost" className="text-danger" onClick={() => setShowReject(!showReject)}>Reject</Button>
            </div>
          )}
          {doc.status === "rejected" && doc.rejection_reason && (
            <p className="text-[10px] text-red-600 text-right">{doc.rejection_reason}</p>
          )}
        </td>
      </tr>
      {showReject && (
        <tr>
          <td colSpan={6} className="px-4 pb-3">
            <div className="flex items-center gap-2">
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Rejection reason (required)" className="flex-1" />
              <Button size="sm" variant="danger" loading={acting} onClick={handleReject}>Confirm Reject</Button>
              <Button size="sm" variant="secondary" onClick={() => { setShowReject(false); setReason(""); }}>Cancel</Button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function DocumentVerificationList() {
  const { documents, loading, error, statusFilter, setStatusFilter, verify, reject } = useDocumentVerifications();

  if (loading) {
    return <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex items-center gap-3">
        <div className="w-40">
          <Select name="status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={STATUS_OPTIONS} />
        </div>
        <span className="text-sm text-text-muted">{documents.length} document{documents.length !== 1 ? "s" : ""}</span>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary text-left">
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Employee</th>
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Document</th>
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">File</th>
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Submitted</th>
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Status</th>
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {documents.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">No documents found.</td></tr>
              ) : (
                documents.map((d) => <VerificationRow key={d.id} doc={d} onVerify={verify} onReject={reject} />)
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
