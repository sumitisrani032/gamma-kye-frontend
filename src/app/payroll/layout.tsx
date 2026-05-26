"use client";

import { ProtectedRoute } from "@/components/common/protected-route";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { useAuth } from "@/contexts/auth-context";

function PayrollGuard({ children }: { children: React.ReactNode }) {
  const { canAccessModule } = useAuth();

  if (!canAccessModule("payroll")) {
    return (
      <div className="flex h-screen overflow-hidden">
        <TenantSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-text-muted">You don&apos;t have permission to access payroll.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <TenantSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

export default function PayrollLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <PayrollGuard>
        {children}
      </PayrollGuard>
    </ProtectedRoute>
  );
}
