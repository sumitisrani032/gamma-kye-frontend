"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, Alert } from "@/components/ui";
import { usePolicies } from "../hooks/use-policies";
import type { PolicyDocument } from "@/types";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  acknowledged: "bg-green-100 text-green-700",
  not_applicable: "bg-surface-tertiary text-text-muted",
};

const CAT_STYLES: Record<string, string> = {
  hr_policy: "bg-blue-100 text-blue-700", code_of_conduct: "bg-purple-100 text-purple-700",
  compliance: "bg-red-100 text-red-700", safety: "bg-orange-100 text-orange-700",
  travel: "bg-teal-100 text-teal-700", benefits: "bg-green-100 text-green-700",
  other: "bg-surface-tertiary text-text-muted",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
}

function PolicyCard({ policy, onAcknowledge }: { policy: PolicyDocument; onAcknowledge: (id: string) => Promise<boolean> }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const needsAck = policy.acknowledgement_required && policy.acknowledgement_status === "pending";

  const handleAck = async () => {
    setLoading(true);
    await onAcknowledge(policy.id);
    setLoading(false);
    setConfirming(false);
  };

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-text-primary">{policy.title}</h3>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${CAT_STYLES[policy.category] || CAT_STYLES.other}`}>
                {policy.category.replace("_", " ")}
              </span>
              {policy.acknowledgement_status && (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_STYLES[policy.acknowledgement_status]}`}>
                  {policy.acknowledgement_status}
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary mt-1">{policy.description || "No description"}</p>
            <p className="text-xs text-text-muted mt-1">
              Version {policy.version_number} · Effective {formatDate(policy.effective_date)} · Published {formatDate(policy.published_at)}
            </p>
            {/* Document download link */}
            {policy.attachment && (
              <div className="flex items-center gap-2 mt-2">
                <svg className="h-4 w-4 text-text-muted shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <span className="text-xs text-primary-600 hover:text-primary-700 cursor-pointer">{policy.attachment.file_name}</span>
              </div>
            )}
            {policy.acknowledged_at && (
              <p className="text-xs text-green-600 mt-1">Acknowledged on {formatDate(policy.acknowledged_at)}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {needsAck && !confirming && (
              <Button size="sm" onClick={() => setConfirming(true)}>Acknowledge</Button>
            )}
            {confirming && (
              <div className="flex items-center gap-2">
                <Button size="sm" loading={loading} onClick={handleAck}>Confirm</Button>
                <Button size="sm" variant="secondary" onClick={() => setConfirming(false)}>Cancel</Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PoliciesPage() {
  const { policies, pending, loading, error, acknowledge } = usePolicies();

  if (loading) {
    return <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      {/* Pending Acknowledgements */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-text-primary">
            Pending Acknowledgements ({pending.length})
          </h2>
          {pending.map((p) => (
            <PolicyCard key={p.id} policy={p} onAcknowledge={acknowledge} />
          ))}
        </div>
      )}

      {/* All Policies — exclude ones already shown in pending section */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-text-primary">All Policies</h2>
        {(() => {
          const pendingIds = new Set(pending.map((p) => p.id));
          const nonPending = policies.filter((p) => !pendingIds.has(p.id));
          return nonPending.length === 0 && pending.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center text-sm text-text-muted">
              No policies published yet.
            </div>
          ) : (
            nonPending.map((p) => (
              <PolicyCard key={p.id} policy={p} onAcknowledge={acknowledge} />
            ))
          );
        })()}
      </div>
    </div>
  );
}
