"use client";

import Link from "next/link";
import { Card, CardContent, Select, Alert } from "@/components/ui";
import { useUsers } from "../hooks/use-users";
import type { UserStatus } from "@/types";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-surface-tertiary text-text-muted",
  locked: "bg-red-100 text-red-800",
};

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "locked", label: "Locked" },
];

function formatDate(dateString: string | null): string {
  if (!dateString) return "Never";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function UserList() {
  const { users, loading, error, statusFilter, setStatusFilter } = useUsers();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Users</h2>
        <div className="w-40">
          <Select
            value={statusFilter || ""}
            onChange={(e) =>
              setStatusFilter(
                (e.target.value as UserStatus) || undefined
              )
            }
            options={STATUS_OPTIONS}
          />
        </div>
      </div>

      {users.length === 0 && !error && (
        <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center text-sm text-text-muted">
          No users match your filter.
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">
                Name
              </th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">
                Email
              </th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">
                Status
              </th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">
                Roles
              </th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">
                Last Login
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-surface-secondary transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={`/settings/users/${u.id}`}
                    className="font-medium text-primary-600 hover:text-primary-700"
                  >
                    {u.first_name} {u.last_name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                      STATUS_STYLES[u.status] || ""
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.roles.map((r) => (
                      <span
                        key={r.id}
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          r.is_system_role
                            ? "bg-primary-50 text-primary-700"
                            : "bg-surface-tertiary text-text-secondary"
                        }`}
                      >
                        {r.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-text-muted text-xs">
                  {formatDate(u.last_login_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
