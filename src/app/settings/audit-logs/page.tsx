"use client";

import { ProtectedRoute } from "@/components/common/protected-route";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { Can } from "@/components/common/can";
import { AuditLogFiltersBar } from "@/features/audit-logs/components/audit-log-filters";
import { AuditLogTable } from "@/features/audit-logs/components/audit-log-table";
import { useAuditLogs } from "@/features/audit-logs/hooks/use-audit-logs";
import { Alert } from "@/components/ui";

export default function AuditLogsPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <TenantSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="border-b border-border bg-surface px-8 py-6">
            <h1 className="text-2xl font-bold text-text-primary">Audit Logs</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Review all changes made within your organization
            </p>
          </div>
          <div className="px-8 py-6">
            <Can
              resource="audit_log"
              action="read"
              fallback={
                <Alert variant="warning">
                  You don&apos;t have permission to view audit logs.
                </Alert>
              }
            >
              <AuditLogsContent />
            </Can>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

function AuditLogsContent() {
  const { logs, loading, error, filters, setFilters, page, setPage, totalPages } =
    useAuditLogs();

  return (
    <div className="space-y-6">
      <AuditLogFiltersBar filters={filters} onApply={setFilters} />
      <AuditLogTable
        logs={logs}
        loading={loading}
        error={error}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
