"use client";

import { ProtectedRoute } from "@/components/common/protected-route";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Can } from "@/components/common/can";
import { UserList } from "@/features/users/components/user-list";
import { Alert } from "@/components/ui";

export default function UsersPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <TenantSidebar />
        <main className="flex-1 overflow-y-auto">
          <TopBar
            title="User Management"
            description="Manage users, their roles, and account status"
          />
          <div className="px-8 py-6">
            <Can
              resource="user"
              action="read"
              fallback={
                <Alert variant="warning">
                  You don&apos;t have permission to manage users.
                </Alert>
              }
            >
              <UserList />
            </Can>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
