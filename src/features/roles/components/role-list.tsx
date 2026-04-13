"use client";

import Link from "next/link";
import { Card, CardContent, Button, Alert } from "@/components/ui";
import { useRoles } from "../hooks/use-roles";
import { useAuth } from "@/contexts/auth-context";

export function RoleList() {
  const { roles, loading, error, remove } = useRoles();
  const { can } = useAuth();

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
        <h2 className="text-lg font-semibold text-text-primary">Roles</h2>
        {can("role", "create") && (
          <Link href="/settings/roles/new">
            <Button>Create Role</Button>
          </Link>
        )}
      </div>

      {roles.length === 0 && !error && (
        <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center text-sm text-text-muted">
          No roles found.
        </div>
      )}

      <div className="space-y-3">
        {roles.map((role) => (
          <Link key={role.id} href={`/settings/roles/${role.id}`}>
            <Card className="hover:border-primary-300 transition-colors cursor-pointer">
              <CardContent className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">
                      {role.name}
                    </span>
                    {role.is_system_role && (
                      <span className="inline-flex items-center rounded-full bg-surface-tertiary px-2 py-0.5 text-[10px] font-medium text-text-muted">
                        System
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {role.description}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    {role.users_count} user{role.users_count !== 1 ? "s" : ""} ·{" "}
                    {role.permissions_count} permission
                    {role.permissions_count !== 1 ? "s" : ""}
                  </p>
                </div>
                {!role.is_system_role && can("role", "delete") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      if (confirm(`Delete "${role.name}"?`)) {
                        remove(role.id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
