"use client";

import { useState, useCallback } from "react";
import { Button, Card, CardContent, Alert } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { useBusinessUnits } from "../hooks/use-business-units";
import { BusinessUnitForm } from "./business-unit-form";
import type { BusinessUnit } from "@/types";

interface BusinessUnitListProps {
  onDataChange?: () => void;
}

export function BusinessUnitList({ onDataChange }: BusinessUnitListProps) {
  const { can } = useAuth();
  const { units, loading, error, add, update, remove, formError, fieldErrors, clearFormErrors } = useBusinessUnits();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BusinessUnit | null>(null);

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

  const handleEdit = useCallback((u: BusinessUnit) => {
    clearFormErrors();
    setEditing(u);
    setShowForm(true);
  }, [clearFormErrors]);

  const handleDelete = useCallback(async (id: string) => {
    const ok = await remove(id);
    if (ok) onDataChange?.();
  }, [remove, onDataChange]);

  const openNew = () => { setEditing(null); clearFormErrors(); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); clearFormErrors(); };

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
          {units.length} business {units.length === 1 ? "unit" : "units"} configured
        </p>
        {!showForm && can("business_unit", "create") && <Button size="sm" onClick={openNew}>Add Business Unit</Button>}
      </div>

      {showForm && (
        <Card>
          <CardContent>
            <h3 className="text-sm font-semibold text-text-primary mb-4">
              {editing ? "Edit Business Unit" : "New Business Unit"}
            </h3>
            <BusinessUnitForm
              initial={editing}
              onSubmit={editing ? handleUpdate : handleAdd}
              onCancel={closeForm}
              formError={formError}
              fieldErrors={fieldErrors}
            />
          </CardContent>
        </Card>
      )}

      {units.length > 0 && (
        <div className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
          {units.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text-primary truncate">{u.name}</p>
                  <span className="text-xs text-text-muted font-mono">{u.code}</span>
                </div>
                {u.description && <p className="text-xs text-text-muted mt-0.5">{u.description}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                {can("business_unit", "update") && <Button size="sm" variant="ghost" onClick={() => handleEdit(u)}>Edit</Button>}
                {can("business_unit", "delete") && <Button size="sm" variant="ghost" className="text-danger" onClick={() => handleDelete(u.id)}>Delete</Button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
