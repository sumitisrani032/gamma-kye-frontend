"use client";

import { ProtectedRoute } from "@/components/common/protected-route";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { MyDocumentsPage } from "@/features/my-documents/components/my-documents-page";

export default function MyDocumentsRoute() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <TenantSidebar />
        <main className="flex-1 overflow-y-auto">
          <TopBar title="My Documents" description="Upload and manage your required documents" />
          <div className="px-8 py-6">
            <MyDocumentsPage />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
