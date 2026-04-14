"use client";

import { ProtectedRoute } from "@/components/common/protected-route";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { useAuth } from "@/contexts/auth-context";
import { AttendancePage } from "@/features/attendance/components/attendance-page";

export default function AttendanceRoute() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <TenantSidebar />
        <main className="flex-1 overflow-y-auto">
          <TopBar title="Attendance" description="Track your daily attendance" />
          <div className="px-8 py-6">
            <AttendancePage key={user?.id} />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
