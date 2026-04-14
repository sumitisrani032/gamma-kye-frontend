"use client";

import { useState, useCallback } from "react";
import { Button, Card, CardContent, Alert } from "@/components/ui";
import { useLeaveTypes } from "../hooks/use-leave-types";
import { LeaveTypeForm } from "./leave-type-form";
import type { LeaveTypeSummary, LeaveTypeDetail } from "@/types";

interface LeaveTypeListProps {
  onDataChange?: () => void;
}

export function LeaveTypeList({ onDataChange }: LeaveTypeListProps) {
  const { leaveTypes, loading, error, fetchDetail, add, update, remove, formError, fieldErrors, clearFormErrors } = useLeaveTypes();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LeaveTypeDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

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

  const handleEdit = useCallback(async (lt: LeaveTypeSummary) => {
    setLoadingDetail(true);
    clearFormErrors();
    const detail = await fetchDetail(lt.id);
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

  const badges = (lt: LeaveTypeSummary) => {
    const tags: string[] = [];
    if (lt.is_paid) tags.push("Paid");
    else tags.push("Unpaid");
    if (lt.is_carry_forward) tags.push("CF");
    if (lt.is_encashable) tags.push("Encash");
    if (lt.is_half_day_allowed) tags.push("Half-day");
    return tags;
  };

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {leaveTypes.length} leave {leaveTypes.length === 1 ? "type" : "types"} configured
        </p>
        {!showForm && (
          <Button size="sm" onClick={openNew}>Add Leave Type</Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardContent>
            <h3 className="text-sm font-semibold text-text-primary mb-4">
              {editing ? "Edit Leave Type" : "New Leave Type"}
            </h3>
            <LeaveTypeForm
              initial={editing}
              onSubmit={editing ? handleUpdate : handleAdd}
              onCancel={closeForm}
              formError={formError}
              fieldErrors={fieldErrors}
            />
          </CardContent>
        </Card>
      )}

      {leaveTypes.length > 0 && (
        <div className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
          {leaveTypes.map((lt) => (
            <div key={lt.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: lt.color_code }} />
                  <p className="text-sm font-medium text-text-primary truncate">{lt.name}</p>
                  <span className="text-xs text-text-muted font-mono">{lt.code}</span>
                  {!lt.is_active && (
                    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-1 ml-5">
                  {badges(lt).map((b) => (
                    <span key={b} className="inline-flex items-center rounded bg-surface-tertiary px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <Button size="sm" variant="ghost" onClick={() => handleEdit(lt)} disabled={loadingDetail}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" className="text-danger" onClick={() => handleDelete(lt.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
