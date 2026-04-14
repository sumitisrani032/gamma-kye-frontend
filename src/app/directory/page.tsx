"use client";

import { ProtectedRoute } from "@/components/common/protected-route";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { DirectoryList } from "@/features/directory/components/directory-list";

export default function DirectoryPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <TenantSidebar />
        <main className="flex-1 overflow-y-auto">
          <TopBar title="Employee Directory" description="Find and connect with colleagues" />
          <div className="px-8 py-6">
            <DirectoryList />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
