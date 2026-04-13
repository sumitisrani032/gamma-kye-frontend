"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/common/protected-route";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { ApprovalList } from "@/features/approvals/components/approval-list";
import { useApprovals } from "@/features/approvals/hooks/use-approvals";
import { Button, Alert } from "@/components/ui";

export default function ApprovalsPage() {
  return (
    <ProtectedRoute>
      <ApprovalsContent />
    </ProtectedRoute>
  );
}

function ApprovalsContent() {
  const [showMyPending, setShowMyPending] = useState(true);
  const { instances, loading, error, refresh } = useApprovals({
    my_pending: showMyPending || undefined,
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <TenantSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="border-b border-border bg-surface px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Approvals</h1>
              <p className="mt-1 text-sm text-text-secondary">
                Review and action pending workflow requests
              </p>
            </div>
            <Button variant="ghost" onClick={refresh} disabled={loading}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="px-8 py-6 space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMyPending(true)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                showMyPending
                  ? "bg-primary-600 text-white"
                  : "text-text-secondary hover:bg-surface-tertiary"
              }`}
            >
              My Pending
            </button>
            <button
              onClick={() => setShowMyPending(false)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                !showMyPending
                  ? "bg-primary-600 text-white"
                  : "text-text-secondary hover:bg-surface-tertiary"
              }`}
            >
              All
            </button>
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : (
            <ApprovalList instances={instances} />
          )}
        </div>
      </main>
    </div>
  );
}
