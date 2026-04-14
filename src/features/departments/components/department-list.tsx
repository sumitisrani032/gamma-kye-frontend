"use client";

import { useState, useCallback } from "react";
import { Button, Card, CardContent, Alert } from "@/components/ui";
import { useDepartments } from "../hooks/use-departments";
import { DepartmentForm } from "./department-form";
import type { DepartmentSummary } from "@/types";

interface DepartmentListProps {
  onDataChange?: () => void;
}

export function DepartmentList({ onDataChange }: DepartmentListProps) {
  const { departments, loading, error, add, update, remove, formError, fieldErrors, clearFormErrors } = useDepartments();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DepartmentSummary | null>(null);

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

  const handleEdit = useCallback((dept: DepartmentSummary) => {
    clearFormErrors();
    setEditing(dept);
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

  // Build a map of parent → children for display
  const rootDepts = departments.filter((d) => !d.parent_department_id);
  const childMap = new Map<string, DepartmentSummary[]>();
  for (const d of departments) {
    if (d.parent_department_id) {
      const children = childMap.get(d.parent_department_id) || [];
      children.push(d);
      childMap.set(d.parent_department_id, children);
    }
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {departments.length} {departments.length === 1 ? "department" : "departments"} configured
        </p>
        {!showForm && (
          <Button size="sm" onClick={openNew}>Add Department</Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardContent>
            <h3 className="text-sm font-semibold text-text-primary mb-4">
              {editing ? "Edit Department" : "New Department"}
            </h3>
            <DepartmentForm
              initial={editing}
              departments={departments}
              onSubmit={editing ? handleUpdate : handleAdd}
              onCancel={closeForm}
              formError={formError}
              fieldErrors={fieldErrors}
            />
          </CardContent>
        </Card>
      )}

      {rootDepts.length > 0 && (
        <div className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
          {rootDepts.map((dept) => (
            <DepartmentRow
              key={dept.id}
              dept={dept}
              children={childMap.get(dept.id) || []}
              onEdit={handleEdit}
              onDelete={handleDelete}
              indent={0}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface DepartmentRowProps {
  dept: DepartmentSummary;
  children: DepartmentSummary[];
  onEdit: (d: DepartmentSummary) => void;
  onDelete: (id: string) => void;
  indent: number;
}

function DepartmentRow({ dept, children, onEdit, onDelete, indent }: DepartmentRowProps) {
  return (
    <>
      <div className="flex items-center justify-between px-4 py-3" style={{ paddingLeft: `${1 + indent * 1.5}rem` }}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {indent > 0 && <span className="text-text-muted text-xs">&#x2514;</span>}
            <p className="text-sm font-medium text-text-primary truncate">{dept.name}</p>
            <span className="text-xs text-text-muted font-mono">{dept.code}</span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            {dept.employees_count} {dept.employees_count === 1 ? "employee" : "employees"}
            {dept.head_employee_id && " \u00b7 Head assigned"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          <Button size="sm" variant="ghost" onClick={() => onEdit(dept)}>
            Edit
          </Button>
          {dept.employees_count === 0 && (
            <Button size="sm" variant="ghost" className="text-danger" onClick={() => onDelete(dept.id)}>
              Delete
            </Button>
          )}
        </div>
      </div>
      {children.map((child) => (
        <DepartmentRow key={child.id} dept={child} children={[]} onEdit={onEdit} onDelete={onDelete} indent={indent + 1} />
      ))}
    </>
  );
}
