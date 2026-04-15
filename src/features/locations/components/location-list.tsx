"use client";

import { useState, useCallback } from "react";
import { Button, Card, CardContent, Alert } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { useLocations } from "../hooks/use-locations";
import { LocationForm } from "./location-form";
import type { LocationDetail, LocationSummary } from "@/types";

interface LocationListProps {
  onDataChange?: () => void;
}

export function LocationList({ onDataChange }: LocationListProps) {
  const { can } = useAuth();
  const { locations, loading, error, add, update, remove, formError, fieldErrors, clearFormErrors } = useLocations();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LocationDetail | null>(null);

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

  const handleEdit = useCallback((loc: LocationSummary) => {
    clearFormErrors();
    // List response has all the fields we need for editing — cast with defaults for detail-only fields
    setEditing({
      ...loc,
      address: null,
      pincode: null,
      latitude: null,
      longitude: null,
      created_at: "",
    } as LocationDetail);
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
          {locations.length} {locations.length === 1 ? "location" : "locations"} configured
        </p>
        {!showForm && can("location", "create") && (
          <Button size="sm" onClick={openNew}>Add Location</Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardContent>
            <h3 className="text-sm font-semibold text-text-primary mb-4">
              {editing ? "Edit Location" : "New Location"}
            </h3>
            <LocationForm
              initial={editing}
              onSubmit={editing ? handleUpdate : handleAdd}
              onCancel={closeForm}
              formError={formError}
              fieldErrors={fieldErrors}
            />
          </CardContent>
        </Card>
      )}

      {locations.length > 0 && (
        <div className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
          {locations.map((l) => (
            <div key={l.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text-primary truncate">{l.name}</p>
                  <span className="text-xs text-text-muted font-mono">{l.code}</span>
                  {l.is_headquarters && (
                    <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                      HQ
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  {l.city}, {l.state}, {l.country} &middot; {l.timezone}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                {can("location", "update") && (
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(l)}>
                    Edit
                  </Button>
                )}
                {!l.is_headquarters && can("location", "delete") && (
                  <Button size="sm" variant="ghost" className="text-danger" onClick={() => handleDelete(l.id)}>
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
