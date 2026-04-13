"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button, Select, Alert, Card, CardContent } from "@/components/ui";
import { PermissionChecklist } from "@/components/common/permission-checklist";
import { useUserDetail } from "../hooks/use-user-detail";
import { useAuth } from "@/contexts/auth-context";
import type { UserStatus, PermissionDetail } from "@/types";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "locked", label: "Locked" },
];

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-surface-tertiary text-text-muted",
  locked: "bg-red-100 text-red-800",
};

interface UserDetailViewProps {
  id: string;
}

/**
 * Group flat permission list into the shape PermissionChecklist expects.
 */
function groupPermissions(
  perms: PermissionDetail[]
): Record<string, PermissionDetail[]> {
  const grouped: Record<string, PermissionDetail[]> = {};
  for (const p of perms) {
    (grouped[p.resource] ||= []).push(p);
  }
  return grouped;
}

export function UserDetailView({ id }: UserDetailViewProps) {
  const {
    user,
    permissions,
    allRoles,
    loading,
    saving,
    error,
    updateStatus,
    addRole,
    deleteRole,
  } = useUserDetail(id);
  const { can } = useAuth();
  const [addingRoleId, setAddingRoleId] = useState("");

  const groupedPermissions = useMemo(
    () => groupPermissions(permissions),
    [permissions]
  );
  const selectedPermissionIds = useMemo(
    () => new Set(permissions.map((p) => p.id)),
    [permissions]
  );

  // Roles the user doesn't already have
  const assignableRoles = useMemo(() => {
    if (!user) return [];
    const currentIds = new Set(user.roles.map((r) => r.id));
    return allRoles.filter((r) => !currentIds.has(r.id));
  }, [user, allRoles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!user) {
    return <Alert variant="error">{error || "User not found."}</Alert>;
  }

  return (
    <div className="space-y-6">
      <Link
        href="/settings/users"
        className="text-sm text-text-secondary hover:text-text-primary"
      >
        &larr; Back to Users
      </Link>

      {error && <Alert variant="error">{error}</Alert>}

      {/* User Info */}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {user.first_name} {user.last_name}
              </h2>
              <p className="text-sm text-text-secondary">{user.email}</p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                STATUS_STYLES[user.status] || ""
              }`}
            >
              {user.status}
            </span>
          </div>

          {can("user", "update") && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-secondary">Status:</span>
              <div className="w-36">
                <Select
                  value={user.status}
                  onChange={(e) =>
                    updateStatus(e.target.value as UserStatus)
                  }
                  options={STATUS_OPTIONS}
                  disabled={saving}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Roles */}
      <Card>
        <CardContent className="space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Roles</h3>

          <div className="flex flex-wrap gap-2">
            {user.roles.map((r) => (
              <span
                key={r.id}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                  r.is_system_role
                    ? "bg-primary-50 text-primary-700"
                    : "bg-surface-tertiary text-text-secondary"
                }`}
              >
                {r.name}
                {can("role", "assign") && (
                  <button
                    onClick={() => {
                      if (confirm(`Remove "${r.name}" from this user?`)) {
                        deleteRole(r.id);
                      }
                    }}
                    disabled={saving}
                    className="ml-0.5 text-text-muted hover:text-danger"
                    title="Remove role"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>

          {can("role", "assign") && assignableRoles.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-48">
                <Select
                  value={addingRoleId}
                  onChange={(e) => setAddingRoleId(e.target.value)}
                  options={[
                    { value: "", label: "Select role..." },
                    ...assignableRoles.map((r) => ({
                      value: r.id,
                      label: r.name,
                    })),
                  ]}
                />
              </div>
              <Button
                size="sm"
                disabled={!addingRoleId || saving}
                loading={saving}
                onClick={async () => {
                  const ok = await addRole(addingRoleId);
                  if (ok) setAddingRoleId("");
                }}
              >
                Add Role
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Effective Permissions (read-only) */}
      <Card>
        <CardContent className="space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">
            Effective Permissions
            <span className="ml-2 text-xs font-normal text-text-muted">
              ({permissions.length} total — computed from all roles)
            </span>
          </h3>

          {permissions.length > 0 ? (
            <PermissionChecklist
              grouped={groupedPermissions}
              selectedIds={selectedPermissionIds}
              readOnly
            />
          ) : (
            <p className="text-sm text-text-muted">
              No permissions. Assign roles to grant access.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
