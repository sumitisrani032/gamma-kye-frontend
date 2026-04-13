"use client";

import Link from "next/link";
import { Card, CardContent, Alert } from "@/components/ui";
import { StatusBadge } from "@/components/common/status-badge";
import { StepTimeline } from "./step-timeline";
import { ApprovalActions } from "./approval-actions";
import { useApprovalDetail } from "../hooks/use-approval-detail";
import { useAuth } from "@/contexts/auth-context";

interface ApprovalDetailProps {
  id: string;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ApprovalDetail({ id }: ApprovalDetailProps) {
  const {
    instance,
    loading,
    error,
    actionLoading,
    actionError,
    approve,
    reject,
    cancel,
  } = useApprovalDetail(id);
  const { user, canWithScope } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !instance) {
    return <Alert variant="error">{error || "Approval not found."}</Alert>;
  }

  const isPending =
    instance.status === "pending" || instance.status === "in_progress";

  const userId = String(user?.id);

  // Approve/Reject: only the assigned approver of the *current* pending step
  const currentStep = instance.step_instances?.find(
    (s) => s.step_order === instance.current_step_order
  );
  const isAssignedApprover =
    isPending && currentStep?.assigned_to?.id === userId;

  // Cancel: initiator can cancel their own, admin can cancel any
  const isInitiator = instance.initiated_by.id === userId;
  const isAdmin = canWithScope("workflow", "read", "global");
  const canCancel = isPending && (isInitiator || isAdmin);

  const showActions = isAssignedApprover || canCancel;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/approvals"
          className="text-sm text-text-secondary hover:text-text-primary"
        >
          &larr; Back to Approvals
        </Link>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-text-primary capitalize">
                {instance.entity_type.replace("_", " ")} Approval
              </h2>
              <p className="text-sm text-text-secondary">
                Requested by{" "}
                <span className="font-medium">
                  {instance.initiated_by.first_name}{" "}
                  {instance.initiated_by.last_name}
                </span>
                {" · "}
                {formatDate(instance.created_at)}
              </p>
            </div>
            <StatusBadge status={instance.status} />
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              Approval Steps
            </h3>
            <StepTimeline steps={instance.step_instances || []} />
          </div>

          {showActions && (
            <div className="border-t border-border pt-4">
              {isAssignedApprover && (
                <h3 className="text-sm font-semibold text-text-primary mb-3">
                  Your Action
                </h3>
              )}
              <ApprovalActions
                showApproveReject={isAssignedApprover}
                showCancel={canCancel}
                onApprove={approve}
                onReject={reject}
                onCancel={cancel}
                loading={actionLoading}
                error={actionError}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
