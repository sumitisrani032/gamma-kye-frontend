"use client";

import { ProtectedRoute } from "@/components/common/protected-route";
import { DashboardContent } from "@/features/dashboard/components/dashboard-content";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
