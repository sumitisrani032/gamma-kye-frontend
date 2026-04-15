"use client";

import { ProtectedRoute } from "@/components/common/protected-route";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { DirectoryList } from "@/features/directory/components/directory-list";
import { useAuth } from "@/contexts/auth-context";

export default function DirectoryPage() {
  const { user } = useAuth();
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <TenantSidebar />
        <main className="flex-1 overflow-y-auto">
          <TopBar title="Employee Directory" description="Find and connect with colleagues" />
          <div className="px-8 py-6">
            <DirectoryList key={user?.id} />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
