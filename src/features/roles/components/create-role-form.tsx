"use client";

import { useRouter } from "next/navigation";
import { Button, Input, Alert } from "@/components/ui";
import { PermissionChecklist } from "@/components/common/permission-checklist";
import { useCreateRole } from "../hooks/use-create-role";
import Link from "next/link";

export function CreateRoleForm() {
  const router = useRouter();
  const {
    name,
    setName,
    description,
    setDescription,
    allPermissions,
    selectedIds,
    setSelectedIds,
    loading,
    saving,
    error,
    fieldErrors,
    handleSubmit,
  } = useCreateRole();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await handleSubmit();
    if (ok) router.push("/settings/roles");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Link
        href="/settings/roles"
        className="text-sm text-text-secondary hover:text-text-primary"
      >
        &larr; Back to Roles
      </Link>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">
          Create Custom Role
        </h2>
        <Input
          label="Role Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Recruitment Lead"
          required
          error={fieldErrors["name"]?.[0]}
        />
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What this role is for..."
          error={fieldErrors["description"]?.[0]}
        />
      </div>

      <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
        <h3 className="text-sm font-semibold text-text-primary">
          Assign Permissions
        </h3>
        <PermissionChecklist
          grouped={allPermissions}
          selectedIds={selectedIds}
          onChange={setSelectedIds}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" loading={saving}>
          Create Role
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/settings/roles")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
