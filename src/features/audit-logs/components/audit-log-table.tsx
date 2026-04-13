"use client";

import { Button, Alert } from "@/components/ui";
import { ChangesDiff } from "./changes-diff";
import type { AuditLog } from "@/types";

interface AuditLogTableProps {
  logs: AuditLog[];
  loading: boolean;
  error: string;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AuditLogTable({
  logs,
  loading,
  error,
  page,
  totalPages,
  onPageChange,
}: AuditLogTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error) return <Alert variant="error">{error}</Alert>;

  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center text-sm text-text-muted">
        No audit logs match your filters.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">
                Time
              </th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">
                User
              </th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">
                Action
              </th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">
                Resource
              </th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">
                Changes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-3 whitespace-nowrap text-text-muted text-xs">
                  {formatDate(log.created_at)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-text-primary">
                  {log.user.first_name} {log.user.last_name}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium capitalize ${
                      log.action === "create"
                        ? "bg-green-100 text-green-700"
                        : log.action === "delete"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-text-secondary">
                  {log.resource_type}
                </td>
                <td className="px-4 py-3">
                  <ChangesDiff changes={log.changes_data} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
