"use client";

import { ProtectedRoute } from "@/components/common/protected-route";
import { useAuth } from "@/contexts/auth-context";
import { DashboardContent } from "@/features/dashboard/components/dashboard-content";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <DashboardContent key={user?.id} />
    </ProtectedRoute>
  );
}
