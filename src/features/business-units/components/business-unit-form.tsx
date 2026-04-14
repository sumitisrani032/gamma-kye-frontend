"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Input, Select, Alert } from "@/components/ui";
import { listCompanies } from "@/services/company-service";
import type { BusinessUnitFormData, BusinessUnit, CompanySummary } from "@/types";

interface BusinessUnitFormProps {
  initial?: BusinessUnit | null;
  onSubmit: (data: BusinessUnitFormData) => Promise<boolean>;
  onCancel: () => void;
  formError: string;
  fieldErrors: Record<string, string[]>;
}

const EMPTY_FORM: BusinessUnitFormData = {
  name: "",
  code: "",
  company_id: "",
  description: "",
};

function fromUnit(u: BusinessUnit): BusinessUnitFormData {
  return {
    name: u.name,
    code: u.code,
    company_id: u.company_id,
    description: u.description || "",
  };
}

export function BusinessUnitForm({ initial, onSubmit, onCancel, formError, fieldErrors }: BusinessUnitFormProps) {
  const [form, setForm] = useState<BusinessUnitFormData>(initial ? fromUnit(initial) : EMPTY_FORM);
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listCompanies().then(setCompanies).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.company_id && companies.length > 0) {
      setForm((prev) => ({ ...prev, company_id: companies[0].id }));
    }
  }, [companies, form.company_id]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const fieldError = (field: string) => fieldErrors[field]?.[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await onSubmit(form);
    setSubmitting(false);
    if (ok) onCancel();
  };

  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && <Alert variant="error">{formError}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input label="Name" name="name" value={form.name} onChange={handleChange} required error={fieldError("name")} />
        <Input label="Code" name="code" value={form.code} onChange={handleChange} required placeholder="e.g. PROD" error={fieldError("code")} />
        {companyOptions.length > 0 && (
          <Select label="Company" name="company_id" value={form.company_id} onChange={handleChange} options={companyOptions} required error={fieldError("company_id")} />
        )}
      </div>

      <Input label="Description" name="description" value={form.description || ""} onChange={handleChange} error={fieldError("description")} />

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" loading={submitting}>
          {initial ? "Update Business Unit" : "Add Business Unit"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
