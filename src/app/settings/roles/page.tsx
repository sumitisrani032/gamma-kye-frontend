"use client";

import { ProtectedRoute } from "@/components/common/protected-route";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Can } from "@/components/common/can";
import { RoleList } from "@/features/roles/components/role-list";
import { Alert } from "@/components/ui";

export default function RolesPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <TenantSidebar />
        <main className="flex-1 overflow-y-auto">
          <TopBar
            title="Roles & Permissions"
            description="Manage roles and their permission assignments"
          />
          <div className="px-8 py-6">
            <Can
              resource="role"
              action="read"
              fallback={
                <Alert variant="warning">
                  You don&apos;t have permission to manage roles.
                </Alert>
              }
            >
              <RoleList />
            </Can>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
