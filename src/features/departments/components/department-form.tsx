"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Input, Select, Alert } from "@/components/ui";
import { listCompanies } from "@/services/company-service";
import type { DepartmentFormData, DepartmentSummary, CompanySummary } from "@/types";

interface DepartmentFormProps {
  initial?: DepartmentSummary | null;
  departments: DepartmentSummary[];
  onSubmit: (data: DepartmentFormData) => Promise<boolean>;
  onCancel: () => void;
  formError: string;
  fieldErrors: Record<string, string[]>;
}

const EMPTY_FORM: DepartmentFormData = {
  name: "",
  code: "",
  company_id: "",
  parent_department_id: null,
  description: "",
};

function fromSummary(d: DepartmentSummary): DepartmentFormData {
  return {
    name: d.name,
    code: d.code,
    company_id: d.company_id,
    parent_department_id: d.parent_department_id,
    description: "",
  };
}

export function DepartmentForm({ initial, departments, onSubmit, onCancel, formError, fieldErrors }: DepartmentFormProps) {
  const [form, setForm] = useState<DepartmentFormData>(initial ? fromSummary(initial) : EMPTY_FORM);
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listCompanies().then(setCompanies).catch(() => {});
  }, []);

  // Auto-select first company if not set
  useEffect(() => {
    if (!form.company_id && companies.length > 0) {
      setForm((prev) => ({ ...prev, company_id: companies[0].id }));
    }
  }, [companies, form.company_id]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value || null }));
  }, []);

  const fieldError = (field: string) => fieldErrors[field]?.[0];

  // Filter out self + children from parent options to prevent circular ref
  const parentOptions = [
    { value: "", label: "None (root department)" },
    ...departments
      .filter((d) => !initial || d.id !== initial.id)
      .map((d) => ({ value: d.id, label: d.name })),
  ];

  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await onSubmit({
      ...form,
      parent_department_id: form.parent_department_id || null,
    });
    setSubmitting(false);
    if (ok) onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && <Alert variant="error">{formError}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Department Name" name="name" value={form.name} onChange={handleChange} required error={fieldError("name")} />
        <Input label="Code" name="code" value={form.code} onChange={handleChange} required placeholder="e.g. ENG" error={fieldError("code")} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {companyOptions.length > 0 && (
          <Select
            label="Company"
            name="company_id"
            value={form.company_id}
            onChange={handleChange}
            options={companyOptions}
            required
            error={fieldError("company_id")}
          />
        )}
        <Select
          label="Parent Department"
          name="parent_department_id"
          value={form.parent_department_id || ""}
          onChange={handleChange}
          options={parentOptions}
          error={fieldError("parent_department_id")}
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" loading={submitting}>
          {initial ? "Update Department" : "Add Department"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
