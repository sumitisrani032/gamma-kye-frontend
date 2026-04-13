"use client";

import { ProtectedRoute } from "@/components/common/protected-route";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { CreateRoleForm } from "@/features/roles/components/create-role-form";

export default function NewRolePage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <TenantSidebar />
        <main className="flex-1 overflow-y-auto">
          <TopBar title="Create Role" />
          <div className="px-8 py-6">
            <CreateRoleForm />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
