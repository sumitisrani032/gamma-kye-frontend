"use client";

import { useState, useCallback } from "react";
import { Button, Card, CardContent, Alert } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { useShifts } from "../hooks/use-shifts";
import { ShiftForm } from "./shift-form";
import type { Shift } from "@/types";

interface ShiftListProps {
  onDataChange?: () => void;
}

export function ShiftList({ onDataChange }: ShiftListProps) {
  const { can } = useAuth();
  const { shifts, loading, error, add, update, remove, formError, fieldErrors, clearFormErrors } = useShifts();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);

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

  const handleEdit = useCallback((s: Shift) => {
    clearFormErrors();
    setEditing(s);
    setShowForm(true);
  }, [clearFormErrors]);

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
          {shifts.length} {shifts.length === 1 ? "shift" : "shifts"} configured
        </p>
        {!showForm && can("shift", "create") && (
          <Button size="sm" onClick={openNew}>Add Shift</Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardContent>
            <h3 className="text-sm font-semibold text-text-primary mb-4">
              {editing ? "Edit Shift" : "New Shift"}
            </h3>
            <ShiftForm
              initial={editing}
              onSubmit={editing ? handleUpdate : handleAdd}
              onCancel={closeForm}
              formError={formError}
              fieldErrors={fieldErrors}
            />
          </CardContent>
        </Card>
      )}

      {shifts.length > 0 && (
        <div className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
          {shifts.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text-primary truncate">{s.name}</p>
                  <span className="text-xs text-text-muted font-mono">{s.code}</span>
                  {s.is_default && (
                    <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                      Default
                    </span>
                  )}
                  {!s.is_active && (
                    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  {s.start_time} – {s.end_time} &middot; {s.full_day_hours}h day &middot; Grace {s.grace_minutes}min &middot; Off: {s.weekly_offs.map((d) => d.slice(0, 3)).join(", ")}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                {can("shift", "update") && (
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(s)}>
                    Edit
                  </Button>
                )}
                {!s.is_default && can("shift", "delete") && (
                  <Button size="sm" variant="ghost" className="text-danger" onClick={() => handleDelete(s.id)}>
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
