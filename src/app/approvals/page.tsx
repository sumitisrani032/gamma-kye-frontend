"use client";

import { useState, useMemo } from "react";
import { ProtectedRoute } from "@/components/common/protected-route";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { ApprovalList } from "@/features/approvals/components/approval-list";
import { MyRequestsList } from "@/features/approvals/components/my-requests-list";
import { useApprovals } from "@/features/approvals/hooks/use-approvals";
import { useMyRequests } from "@/features/approvals/hooks/use-my-requests";
import { useAuth } from "@/contexts/auth-context";
import { Button, Alert } from "@/components/ui";
import type { WorkflowInstanceListParams } from "@/services/workflow-service";
import type { MyRequestStatus, MyRequestType } from "@/types";

type Tab = "my_requests" | "my_pending" | "all";

interface TabConfig {
  key: Tab;
  label: string;
  params: WorkflowInstanceListParams;
}

const TABS: TabConfig[] = [
  { key: "my_requests", label: "My Requests", params: {} },
  { key: "my_pending", label: "Pending Approvals", params: { my_pending: true } },
  { key: "all", label: "All", params: {} },
];

const TYPE_FILTERS: { value: MyRequestType | ""; label: string }[] = [
  { value: "", label: "All types" },
  { value: "leave_request", label: "Leaves" },
  { value: "wfh_request", label: "WFH" },
  { value: "attendance_regularization", label: "Regularizations" },
];

const STATUS_FILTERS: { value: MyRequestStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

export default function ApprovalsPage() {
  const { user } = useAuth();
  return (
    <ProtectedRoute>
      <ApprovalsContent key={user?.id} />
    </ProtectedRoute>
  );
}

function ApprovalsContent() {
  const { can, canWithScope } = useAuth();

  const visibleTabs = useMemo(() => {
    const tabs: TabConfig[] = [];

    // My Requests — always visible (any user can initiate workflows)
    tabs.push(TABS[0]);

    // Pending Approvals — visible if user has any approve permission on any resource
    if (can("leave_request", "approve") || can("attendance_regularization", "approve")) {
      tabs.push(TABS[1]);
    }

    // All — only Tenant Admin (needs global scope on workflow read)
    if (canWithScope("workflow", "read", "global")) {
      tabs.push(TABS[2]);
    }

    return tabs;
  }, [can, canWithScope]);

  const [activeTab, setActiveTab] = useState<Tab>(visibleTabs[0].key);
  const [typeFilter, setTypeFilter] = useState<MyRequestType | "">("");
  const [statusFilter, setStatusFilter] = useState<MyRequestStatus | "">("");

  const isMyRequests = activeTab === "my_requests";

  const currentTab = visibleTabs.find((t) => t.key === activeTab) || visibleTabs[0];
  const approvals = useApprovals(isMyRequests ? undefined : currentTab.params);
  const mine = useMyRequests({
    status: statusFilter || undefined,
    type: typeFilter || undefined,
  });

  const loading = isMyRequests ? mine.loading : approvals.loading;
  const error = isMyRequests ? mine.error : approvals.error;
  const refresh = isMyRequests ? mine.refresh : approvals.refresh;

  return (
    <div className="flex h-screen overflow-hidden">
      <TenantSidebar />
      <main className="flex-1 overflow-y-auto">
        <TopBar
          title="Approvals"
          description="Track your requests and action pending approvals"
          actions={
            <Button variant="ghost" onClick={refresh} disabled={loading}>
              Refresh
            </Button>
          }
        />

        <div className="px-8 py-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            {visibleTabs.map((tab) => {
              const count = tab.key === "my_requests"
                ? mine.summary?.total
                : undefined;
              return (
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
                  {count !== undefined && count > 0 && (
                    <span className="ml-1.5 text-xs opacity-75">({count})</span>
                  )}
                </button>
              );
            })}
          </div>

          {isMyRequests && (
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-text-muted">Type:</span>
              {TYPE_FILTERS.map((f) => (
                <button
                  key={f.value || "all"}
                  onClick={() => setTypeFilter(f.value)}
                  className={`rounded-full px-2.5 py-1 transition-colors ${
                    typeFilter === f.value
                      ? "bg-primary-100 text-primary-700"
                      : "text-text-muted hover:bg-surface-tertiary"
                  }`}
                >
                  {f.label}
                  {mine.summary && f.value && (
                    <span className="ml-1 opacity-75">
                      {mine.summary.by_type[f.value as MyRequestType] ?? 0}
                    </span>
                  )}
                </button>
              ))}
              <span className="ml-3 text-text-muted">Status:</span>
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value || "all"}
                  onClick={() => setStatusFilter(f.value)}
                  className={`rounded-full px-2.5 py-1 transition-colors ${
                    statusFilter === f.value
                      ? "bg-primary-100 text-primary-700"
                      : "text-text-muted hover:bg-surface-tertiary"
                  }`}
                >
                  {f.label}
                  {mine.summary && f.value && (
                    <span className="ml-1 opacity-75">
                      {mine.summary.by_status[f.value as MyRequestStatus] ?? 0}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {error && <Alert variant="error">{error}</Alert>}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : isMyRequests ? (
            <MyRequestsList requests={mine.requests} onRefresh={mine.refresh} />
          ) : (
            <ApprovalList instances={approvals.instances} />
          )}
        </div>
      </main>
    </div>
  );
}
