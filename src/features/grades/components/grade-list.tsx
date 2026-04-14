"use client";

import { useState, useCallback } from "react";
import { Button, Card, CardContent, Alert } from "@/components/ui";
import { useGrades } from "../hooks/use-grades";
import { GradeForm } from "./grade-form";
import type { Grade } from "@/types";

interface GradeListProps {
  onDataChange?: () => void;
}

export function GradeList({ onDataChange }: GradeListProps) {
  const { grades, loading, error, add, update, remove, formError, fieldErrors, clearFormErrors } = useGrades();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Grade | null>(null);

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

  const handleEdit = useCallback((g: Grade) => {
    clearFormErrors();
    setEditing(g);
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
          {grades.length} {grades.length === 1 ? "grade" : "grades"} configured
        </p>
        {!showForm && (
          <Button size="sm" onClick={openNew}>Add Grade</Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardContent>
            <h3 className="text-sm font-semibold text-text-primary mb-4">
              {editing ? "Edit Grade" : "New Grade"}
            </h3>
            <GradeForm
              initial={editing}
              onSubmit={editing ? handleUpdate : handleAdd}
              onCancel={closeForm}
              formError={formError}
              fieldErrors={fieldErrors}
            />
          </CardContent>
        </Card>
      )}

      {grades.length > 0 && (
        <div className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
          {grades.map((g) => (
            <div key={g.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-surface-tertiary text-xs font-medium text-text-secondary">
                    {g.rank}
                  </span>
                  <p className="text-sm font-medium text-text-primary truncate">{g.name}</p>
                  {g.code && <span className="text-xs text-text-muted font-mono">{g.code}</span>}
                </div>
                {g.description && (
                  <p className="text-xs text-text-muted mt-0.5 ml-8">{g.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <Button size="sm" variant="ghost" onClick={() => handleEdit(g)}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" className="text-danger" onClick={() => handleDelete(g.id)}>
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
