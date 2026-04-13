"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input, Alert } from "@/components/ui";
import { PermissionChecklist } from "@/components/common/permission-checklist";
import { useRoleDetail } from "../hooks/use-role-detail";

interface RoleDetailViewProps {
  id: string;
}

export function RoleDetailView({ id }: RoleDetailViewProps) {
  const {
    role,
    allPermissions,
    selectedIds,
    setSelectedIds,
    loading,
    saving,
    error,
    saveInfo,
    savePermissions,
  } = useRoleDetail(id);

  const [editName, setEditName] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!role) {
    return <Alert variant="error">{error || "Role not found."}</Alert>;
  }

  const isSystem = role.is_system_role;
  const isEditingInfo = editName !== null;

  const handleSaveInfo = async () => {
    if (editName === null) return;
    const ok = await saveInfo(editName, editDesc || "");
    if (ok) {
      setEditName(null);
      setEditDesc(null);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href="/settings/roles"
        className="text-sm text-text-secondary hover:text-text-primary"
      >
        &larr; Back to Roles
      </Link>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Role info */}
      <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-text-primary">
              {role.name}
            </h2>
            {isSystem && (
              <span className="inline-flex items-center rounded-full bg-surface-tertiary px-2 py-0.5 text-[10px] font-medium text-text-muted">
                System Role
              </span>
            )}
          </div>
          {!isSystem && !isEditingInfo && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditName(role.name);
                setEditDesc(role.description);
              }}
            >
              Edit
            </Button>
          )}
        </div>

        {isEditingInfo ? (
          <div className="space-y-3">
            <Input
              label="Name"
              value={editName || ""}
              onChange={(e) => setEditName(e.target.value)}
            />
            <Input
              label="Description"
              value={editDesc || ""}
              onChange={(e) => setEditDesc(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" loading={saving} onClick={handleSaveInfo}>
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditName(null);
                  setEditDesc(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">{role.description}</p>
        )}

        <div className="text-xs text-text-muted">
          {role.users_count} user{role.users_count !== 1 ? "s" : ""} ·{" "}
          {role.permissions_count} permission
          {role.permissions_count !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">
            Permissions
          </h3>
          {!isSystem && (
            <Button size="sm" loading={saving} onClick={savePermissions}>
              Save Permissions
            </Button>
          )}
        </div>

        {Object.keys(allPermissions).length > 0 ? (
          <PermissionChecklist
            grouped={allPermissions}
            selectedIds={selectedIds}
            onChange={isSystem ? undefined : setSelectedIds}
            readOnly={isSystem}
          />
        ) : (
          <p className="text-sm text-text-muted">Loading permissions...</p>
        )}
      </div>
    </div>
  );
}
