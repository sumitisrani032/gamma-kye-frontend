"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/common/protected-route";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { useAuth } from "@/contexts/auth-context";
import { getMyProfile } from "@/services/my-profile-service";
import { MyTeamView } from "@/features/org-structure/components/my-team-view";
import { OrgTree } from "@/features/org-structure/components/org-tree";

type Tab = "my-team" | "org-tree";

export default function OrgStructurePage() {
  const { user, canAccessModule } = useAuth();
  const isEmployee = user?.roles?.includes("Employee");
  const isAdmin = canAccessModule("employee");

  const defaultTab: Tab = isEmployee ? "my-team" : "org-tree";
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  // Resolve current user's employee ID
  useEffect(() => {
    if (!isEmployee) return;
    getMyProfile()
      .then((res) => setEmployeeId(res.employee.id))
      .catch(() => {});
  }, [isEmployee]);

  const handleNodeClick = (id: string) => {
    window.open(`/employees/${id}`, "_blank");
  };

  const tabs: { key: Tab; label: string; show: boolean }[] = [
    { key: "my-team", label: "My Team", show: !!isEmployee },
    { key: "org-tree", label: "Organization Tree", show: isAdmin },
  ];

  const visibleTabs = tabs.filter((t) => t.show);
  const showTabs = visibleTabs.length > 1;

  return (
    <ProtectedRoute>
      <div key={user?.id} className="flex h-screen overflow-hidden">
        <TenantSidebar />
        <main className="flex-1 overflow-y-auto">
          <TopBar
            title="Organization"
            description={tab === "my-team" ? "Your team structure" : "Full organization hierarchy"}
          />
          <div className="px-8 py-6">
            {showTabs && (
              <div className="flex gap-1 border-b border-border mb-6">
                {visibleTabs.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      tab === t.key
                        ? "border-primary-600 text-primary-700"
                        : "border-transparent text-text-muted hover:text-text-primary"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {tab === "my-team" && (
              <MyTeamView employeeId={employeeId} onNodeClick={handleNodeClick} />
            )}
            {tab === "org-tree" && (
              <OrgTree currentUserId={employeeId} onNodeClick={handleNodeClick} />
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
