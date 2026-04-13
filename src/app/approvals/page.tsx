"use client";

import { useState, useMemo } from "react";
import { ProtectedRoute } from "@/components/common/protected-route";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { ApprovalList } from "@/features/approvals/components/approval-list";
import { useApprovals } from "@/features/approvals/hooks/use-approvals";
import { useAuth } from "@/contexts/auth-context";
import { Button, Alert } from "@/components/ui";
import type { WorkflowInstanceListParams } from "@/services/workflow-service";

type Tab = "my_requests" | "my_pending" | "all";

interface TabConfig {
  key: Tab;
  label: string;
  params: WorkflowInstanceListParams;
}

const TABS: TabConfig[] = [
  { key: "my_requests", label: "My Requests", params: { my_requests: true } },
  { key: "my_pending", label: "Pending Approvals", params: { my_pending: true } },
  { key: "all", label: "All", params: {} },
];

export default function ApprovalsPage() {
  return (
    <ProtectedRoute>
      <ApprovalsContent />
    </ProtectedRoute>
  );
}

function ApprovalsContent() {
  const { canWithScope } = useAuth();

  const visibleTabs = useMemo(() => {
    const tabs: TabConfig[] = [];

    // My Requests — always visible (any user can initiate workflows)
    tabs.push(TABS[0]);

    // Pending Approvals — visible to anyone who can approve workflows
    // (managers, HR, admins — anyone with workflow approve at any scope)
    if (canWithScope("workflow", "approve", "self")) {
      tabs.push(TABS[1]);
    }

    // All — only Tenant Admin (needs global scope on workflow read)
    if (canWithScope("workflow", "read", "global")) {
      tabs.push(TABS[2]);
    }

    return tabs;
  }, [canWithScope]);

  const [activeTab, setActiveTab] = useState<Tab>(visibleTabs[0].key);

  const currentTab = visibleTabs.find((t) => t.key === activeTab) || visibleTabs[0];
  const { instances, loading, error, refresh } = useApprovals(currentTab.params);

  return (
    <div className="flex h-screen overflow-hidden">
      <TenantSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="border-b border-border bg-surface px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Approvals</h1>
              <p className="mt-1 text-sm text-text-secondary">
                Track your requests and action pending approvals
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={refresh} disabled={loading}>
                Refresh
              </Button>
              <NotificationBell />
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            {visibleTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-primary-600 text-white"
                    : "text-text-secondary hover:bg-surface-tertiary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : (
            <ApprovalList instances={instances} />
          )}
        </div>
      </main>
    </div>
  );
}
