"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Card, CardContent, Alert } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { listLeaveTypes } from "@/services/leave-type-service";
import { useLeavePolicies } from "../hooks/use-leave-policies";
import { LeavePolicyForm } from "./leave-policy-form";
import type { LeavePolicySummary, LeavePolicyDetail, LeaveTypeSummary } from "@/types";

interface LeavePolicyListProps {
  onDataChange?: () => void;
}

export function LeavePolicyList({ onDataChange }: LeavePolicyListProps) {
  const { can } = useAuth();
  const { policies, loading, error, fetchDetail, add, update, remove, formError, fieldErrors, clearFormErrors } = useLeavePolicies();
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeSummary[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LeavePolicyDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    listLeaveTypes().then(setLeaveTypes).catch(() => {});
  }, []);

  const leaveTypeName = (id: string) => leaveTypes.find((lt) => lt.id === id)?.name ?? "—";

  const handleAdd = useCallback(async (data: Parameters<typeof add>[0]) => {
    const ok = await add(data);
    if (ok) onDataChange?.();
    return ok;
  }, [add, onDataChange]);

  const handleUpdate = useCallback(async (data: Parameters<typeof update>[1]) => {
    if (!editing) return false;
    const ok = await update(editing.id, data);
    if (ok) onDataChange?.();
    return ok;
  }, [update, editing, onDataChange]);

  const handleEdit = useCallback(async (p: LeavePolicySummary) => {
    setLoadingDetail(true);
    clearFormErrors();
    const detail = await fetchDetail(p.id);
    if (detail) {
      setEditing(detail);
      setShowForm(true);
    }
    setLoadingDetail(false);
  }, [fetchDetail, clearFormErrors]);

  const handleDelete = useCallback(async (id: string) => {
    const ok = await remove(id);
    if (ok) onDataChange?.();
  }, [remove, onDataChange]);

  const openNew = () => {
    setEditing(null);
    clearFormErrors();
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    clearFormErrors();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {policies.length} {policies.length === 1 ? "policy" : "policies"} configured
        </p>
        {!showForm && can("leave_policy", "create") && (
          <Button size="sm" onClick={openNew}>Add Policy</Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardContent>
            <h3 className="text-sm font-semibold text-text-primary mb-4">
              {editing ? "Edit Leave Policy" : "New Leave Policy"}
            </h3>
            <LeavePolicyForm
              initial={editing}
              onSubmit={editing ? handleUpdate : handleAdd}
              onCancel={closeForm}
              formError={formError}
              fieldErrors={fieldErrors}
            />
          </CardContent>
        </Card>
      )}

      {policies.length > 0 && (
        <div className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
          {policies.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text-primary truncate">{p.name}</p>
                  {!p.is_active && (
                    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  {leaveTypeName(p.leave_type_id)} &middot; {p.accrual_type} &middot; {p.annual_quota} days/yr &middot; From {p.effective_from}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                {can("leave_policy", "update") && (
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(p)} disabled={loadingDetail}>
                    Edit
                  </Button>
                )}
                {can("leave_policy", "delete") && (
                  <Button size="sm" variant="ghost" className="text-danger" onClick={() => handleDelete(p.id)}>
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
