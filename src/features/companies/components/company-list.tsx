"use client";

import { useState, useCallback } from "react";
import { Button, Card, CardContent, Alert } from "@/components/ui";
import { getCompany } from "@/services/company-service";
import { useCompanies } from "../hooks/use-companies";
import { CompanyForm } from "./company-form";
import type { CompanyDetail } from "@/types";

interface CompanyListProps {
  onDataChange?: () => void;
}

export function CompanyList({ onDataChange }: CompanyListProps) {
  const { companies, loading, error, add, update, remove, formError, fieldErrors, clearFormErrors } = useCompanies();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CompanyDetail | null>(null);
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

  const handleEdit = useCallback(async (id: string) => {
    setLoadingDetail(true);
    clearFormErrors();
    try {
      const detail = await getCompany(id);
      setEditing(detail);
      setShowForm(true);
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoadingDetail(false);
    }
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
          {companies.length} {companies.length === 1 ? "company" : "companies"} configured
        </p>
        {!showForm && (
          <Button size="sm" onClick={openNew}>Add Company</Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardContent>
            <h3 className="text-sm font-semibold text-text-primary mb-4">
              {editing ? "Edit Company" : "New Company"}
            </h3>
            <CompanyForm
              initial={editing}
              onSubmit={editing ? handleUpdate : handleAdd}
              onCancel={closeForm}
              formError={formError}
              fieldErrors={fieldErrors}
            />
          </CardContent>
        </Card>
      )}

      {companies.length > 0 && (
        <div className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
          {companies.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text-primary truncate">{c.name}</p>
                  {c.is_primary && (
                    <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                      Primary
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  {c.legal_name} &middot; {c.city}, {c.state}, {c.country}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <Button size="sm" variant="ghost" onClick={() => handleEdit(c.id)} disabled={loadingDetail}>
                  Edit
                </Button>
                {!c.is_primary && (
                  <Button size="sm" variant="ghost" className="text-danger" onClick={() => handleDelete(c.id)}>
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
