"use client";

import { useState } from "react";
import { Button, Input, Select } from "@/components/ui";
import type { AuditLogFilters } from "@/types";

const RESOURCE_TYPES = [
  { value: "", label: "All Resources" },
  { value: "User", label: "User" },
  { value: "Tenant", label: "Tenant" },
  { value: "Role", label: "Role" },
  { value: "WorkflowDefinition", label: "Workflow Definition" },
  { value: "WorkflowInstance", label: "Workflow Instance" },
  { value: "Employee", label: "Employee" },
  { value: "LeaveRequest", label: "Leave Request" },
];

const ACTIONS = [
  { value: "", label: "All Actions" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "approve_step", label: "Approve Step" },
  { value: "reject_step", label: "Reject Step" },
  { value: "cancel_workflow", label: "Cancel Workflow" },
];

interface AuditLogFiltersProps {
  filters: AuditLogFilters;
  onApply: (filters: AuditLogFilters) => void;
}

export function AuditLogFiltersBar({ filters, onApply }: AuditLogFiltersProps) {
  const [local, setLocal] = useState<AuditLogFilters>(filters);

  const handleApply = () => onApply(local);

  const handleReset = () => {
    const empty: AuditLogFilters = {};
    setLocal(empty);
    onApply(empty);
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Select
        label="Resource"
        value={local.resource_type || ""}
        onChange={(e) => setLocal((p) => ({ ...p, resource_type: e.target.value || undefined }))}
        options={RESOURCE_TYPES}
      />
      <Select
        label="Action"
        value={local.action_filter || ""}
        onChange={(e) => setLocal((p) => ({ ...p, action_filter: e.target.value || undefined }))}
        options={ACTIONS}
      />
      <Input
        label="From"
        type="date"
        value={local.from || ""}
        onChange={(e) => setLocal((p) => ({ ...p, from: e.target.value || undefined }))}
      />
      <Input
        label="To"
        type="date"
        value={local.to || ""}
        onChange={(e) => setLocal((p) => ({ ...p, to: e.target.value || undefined }))}
      />
      <Button size="sm" onClick={handleApply}>
        Apply
      </Button>
      <Button size="sm" variant="ghost" onClick={handleReset}>
        Reset
      </Button>
    </div>
  );
}
