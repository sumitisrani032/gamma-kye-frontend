"use client";

import { ProtectedRoute } from "@/components/common/protected-route";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { MyProfilePage } from "@/features/my-profile/components/my-profile-page";

export default function MyProfileRoute() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <TenantSidebar />
        <main className="flex-1 overflow-y-auto">
          <TopBar title="My Profile" />
          <div className="px-8 py-6">
            <MyProfilePage />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
