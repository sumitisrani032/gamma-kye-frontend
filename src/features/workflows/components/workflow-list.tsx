"use client";

import Link from "next/link";
import { Card, CardContent, Button, Alert } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { useWorkflowDefinitions } from "../hooks/use-workflow-definitions";

const ENTITY_LABELS: Record<string, string> = {
  leave_request: "Leave Request",
  expense_claim: "Expense Claim",
  employee_onboarding: "Onboarding",
  employee_offboarding: "Offboarding",
};

export function WorkflowList() {
  const { can } = useAuth();
  const { definitions, loading, error, remove } = useWorkflowDefinitions();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">
          Workflow Definitions
        </h2>
        {can("workflow", "create") && (
          <Link href="/settings/workflows/new">
            <Button>New Workflow</Button>
          </Link>
        )}
      </div>

      {definitions.length === 0 && !error && (
        <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center text-sm text-text-muted">
          No workflow definitions yet. Create one to get started.
        </div>
      )}

      <div className="space-y-3">
        {definitions.map((def) => (
          <Card key={def.id}>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary">
                    {def.name}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      def.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-surface-tertiary text-text-muted"
                    }`}
                  >
                    {def.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-text-secondary">
                  {ENTITY_LABELS[def.entity_type] || def.entity_type} ·{" "}
                  {def.steps_count} step{def.steps_count !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {can("workflow", "update") && (
                  <Link href={`/settings/workflows/${def.id}`}>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </Link>
                )}
                {can("workflow", "delete") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm("Delete this workflow definition?")) {
                        remove(def.id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
