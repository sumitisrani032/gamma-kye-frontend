"use client";

import { ProtectedRoute } from "@/components/common/protected-route";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { useAuth } from "@/contexts/auth-context";
import { CalendarPage } from "@/features/calendar/components/calendar-page";

export default function CalendarRoute() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <TenantSidebar />
        <main className="flex-1 overflow-y-auto">
          <TopBar title="Calendar" description="Your attendance, leaves, and holidays" />
          <div className="px-8 py-6">
            <CalendarPage key={user?.id} />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
