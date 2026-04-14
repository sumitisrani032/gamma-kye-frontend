"use client";

import { ProtectedRoute } from "@/components/common/protected-route";
import { SetupWizard } from "@/features/setup/components/setup-wizard";

export default function SetupPage() {
  return (
    <ProtectedRoute>
      <SetupWizard />
    </ProtectedRoute>
  );
}
