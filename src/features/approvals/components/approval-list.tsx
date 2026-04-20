"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui";
import { StatusBadge } from "@/components/common/status-badge";
import { RequestCard } from "./request-card";
import type { WorkflowInstance } from "@/types";

interface ApprovalListProps {
  instances: WorkflowInstance[];
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

/** Fallback card shown when the underlying request has been deleted. */
function OrphanedWorkflowCard({ inst }: { inst: WorkflowInstance }) {
  return (
    <Link href={`/approvals/${inst.id}`}>
      <Card className="hover:border-primary-300 transition-colors cursor-pointer">
        <CardContent className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-primary capitalize">
                {inst.entity_type.replace("_", " ")}
              </span>
              <StatusBadge status={inst.status} />
              <span className="text-[10px] text-text-muted italic">request removed</span>
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              Requested by{" "}
              <span className="font-medium">
                {inst.initiated_by.first_name} {inst.initiated_by.last_name}
              </span>
              {" · "}Step {inst.current_step_order}
              {inst.step_instances && ` of ${inst.step_instances.length}`}
            </p>
          </div>
          <span className="text-xs text-text-muted shrink-0">
            {formatDate(inst.created_at)}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

export function ApprovalList({ instances }: ApprovalListProps) {
  if (instances.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center text-sm text-text-muted">
        No approvals to display.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {instances.map((inst) =>
        inst.entity ? (
          <RequestCard
            key={inst.id}
            entity={inst.entity}
            requester={inst.initiated_by}
          />
        ) : (
          <OrphanedWorkflowCard key={inst.id} inst={inst} />
        ),
      )}
    </div>
  );
}
