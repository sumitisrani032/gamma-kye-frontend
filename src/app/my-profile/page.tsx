"use client";

import { ProtectedRoute } from "@/components/common/protected-route";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { useAuth } from "@/contexts/auth-context";
import { MyProfilePage } from "@/features/my-profile/components/my-profile-page";

export default function MyProfileRoute() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <TenantSidebar />
        <main className="flex-1 overflow-y-auto">
          <TopBar title="My Profile" />
          <div className="px-8 py-6">
            <MyProfilePage key={user?.id} />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
