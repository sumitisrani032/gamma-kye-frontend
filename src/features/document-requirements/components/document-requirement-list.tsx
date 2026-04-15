"use client";

import { useState, useCallback } from "react";
import { Button, Card, CardContent, CardHeader, Input, Select, Alert } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { useDocumentRequirements } from "../hooks/use-document-requirements";
import type { DocumentRequirement, DocumentRequirementFormData } from "@/types";

const DOC_TYPES = [
  { value: "id_proof", label: "ID Proof" }, { value: "address_proof", label: "Address Proof" },
  { value: "education", label: "Education" }, { value: "experience", label: "Experience" },
  { value: "offer_letter", label: "Offer Letter" }, { value: "relieving_letter", label: "Relieving Letter" },
  { value: "payslip", label: "Payslip" }, { value: "pan", label: "PAN" },
  { value: "aadhaar", label: "Aadhaar" }, { value: "passport", label: "Passport" },
  { value: "bank_proof", label: "Bank Proof" }, { value: "other", label: "Other" },
];

const APPLICABLE_OPTIONS = [
  { value: "all", label: "All Employees" }, { value: "department", label: "Department" },
  { value: "role", label: "Role" }, { value: "employment_type", label: "Employment Type" },
];

const EMPTY: DocumentRequirementFormData = {
  name: "", document_type: "id_proof", is_mandatory: true, has_expiry: false,
  applicable_to: "all", allowed_file_types: "pdf,jpg,png", max_file_size_mb: 5,
};

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500" />
      {label}
    </label>
  );
}

function RequirementForm({ initial, onSubmit, onCancel }: {
  initial?: DocumentRequirement; onSubmit: (d: DocumentRequirementFormData) => Promise<boolean>; onCancel: () => void;
}) {
  const [form, setForm] = useState<DocumentRequirementFormData>(
    initial ? { name: initial.name, document_type: initial.document_type, description: initial.description || "", is_mandatory: initial.is_mandatory, has_expiry: initial.has_expiry, applicable_to: initial.applicable_to, allowed_file_types: initial.allowed_file_types, max_file_size_mb: initial.max_file_size_mb } : EMPTY
  );
  const [submitting, setSubmitting] = useState(false);
  const set = (k: keyof DocumentRequirementFormData, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await onSubmit(form);
    setSubmitting(false);
    if (ok) onCancel();
  };

  return (
    <form onSubmit={handle} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
        <Select label="Document Type" name="document_type" value={form.document_type} onChange={(e) => set("document_type", e.target.value)} options={DOC_TYPES} />
      </div>
      <Input label="Description" value={form.description || ""} onChange={(e) => set("description", e.target.value)} placeholder="Brief description" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select label="Applicable To" name="applicable_to" value={form.applicable_to} onChange={(e) => set("applicable_to", e.target.value)} options={APPLICABLE_OPTIONS} />
        <Input label="Allowed File Types" value={form.allowed_file_types || ""} onChange={(e) => set("allowed_file_types", e.target.value)} placeholder="pdf,jpg,png" />
      </div>
      <div className="flex items-center gap-6">
        <Toggle label="Mandatory" checked={form.is_mandatory} onChange={(v) => set("is_mandatory", v)} />
        <Toggle label="Has Expiry" checked={form.has_expiry} onChange={(v) => set("has_expiry", v)} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" loading={submitting}>{initial ? "Update" : "Create"}</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

export function DocumentRequirementList() {
  const { can } = useAuth();
  const { requirements, loading, error, formError, add, update, remove, clearFormErrors } = useDocumentRequirements();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DocumentRequirement | null>(null);

  const handleAdd = useCallback(async (data: DocumentRequirementFormData) => {
    const ok = await add(data);
    if (ok) setShowForm(false);
    return ok;
  }, [add]);

  const handleUpdate = useCallback(async (data: DocumentRequirementFormData) => {
    if (!editing) return false;
    const ok = await update(editing.id, data);
    if (ok) setEditing(null);
    return ok;
  }, [editing, update]);

  if (loading) {
    return <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      {formError && <Alert variant="error">{formError}</Alert>}

      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">{requirements.length} requirement{requirements.length !== 1 ? "s" : ""}</p>
        {!showForm && !editing && can("document_requirement", "create") && <Button onClick={() => { clearFormErrors(); setShowForm(true); }}>Add Requirement</Button>}
      </div>

      {(showForm || editing) && (
        <Card>
          <CardHeader><h3 className="text-sm font-semibold text-text-primary">{editing ? "Edit Requirement" : "New Requirement"}</h3></CardHeader>
          <CardContent>
            <RequirementForm initial={editing || undefined} onSubmit={editing ? handleUpdate : handleAdd} onCancel={() => { setShowForm(false); setEditing(null); clearFormErrors(); }} />
          </CardContent>
        </Card>
      )}

      {requirements.length === 0 && !showForm ? (
        <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center text-sm text-text-muted">No document requirements defined yet.</div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
          {requirements.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text-primary">{r.name}</p>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-surface-tertiary text-text-muted capitalize">{r.document_type.replace("_", " ")}</span>
                  {r.is_mandatory && <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-red-100 text-red-700">Mandatory</span>}
                  {!r.is_active && <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-yellow-100 text-yellow-700">Inactive</span>}
                </div>
                <p className="text-xs text-text-muted mt-0.5">{r.description || "No description"} · {r.applicable_to} · {r.allowed_file_types}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {can("document_requirement", "update") && <Button size="sm" variant="secondary" onClick={() => { clearFormErrors(); setEditing(r); setShowForm(false); }}>Edit</Button>}
                {can("document_requirement", "delete") && <Button size="sm" variant="ghost" className="text-danger" onClick={() => { if (confirm(`Delete "${r.name}"?`)) remove(r.id); }}>Delete</Button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
