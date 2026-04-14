"use client";

import { useState, useCallback } from "react";
import { Button, Input, Alert } from "@/components/ui";
import type { DesignationFormData, Designation } from "@/types";

interface DesignationFormProps {
  initial?: Designation | null;
  onSubmit: (data: DesignationFormData) => Promise<boolean>;
  onCancel: () => void;
  formError: string;
  fieldErrors: Record<string, string[]>;
}

const EMPTY_FORM: DesignationFormData = {
  name: "",
  code: "",
  level: 1,
  description: "",
};

function fromDesignation(d: Designation): DesignationFormData {
  return {
    name: d.name,
    code: d.code || "",
    level: d.level,
    description: d.description || "",
  };
}

export function DesignationForm({ initial, onSubmit, onCancel, formError, fieldErrors }: DesignationFormProps) {
  const [form, setForm] = useState<DesignationFormData>(initial ? fromDesignation(initial) : EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "number" ? Number(value) : value }));
  }, []);

  const fieldError = (field: string) => fieldErrors[field]?.[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await onSubmit(form);
    setSubmitting(false);
    if (ok) onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && <Alert variant="error">{formError}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input label="Name" name="name" value={form.name} onChange={handleChange} required error={fieldError("name")} />
        <Input label="Code" name="code" value={form.code || ""} onChange={handleChange} placeholder="e.g. SDE" error={fieldError("code")} />
        <Input label="Level" name="level" type="number" value={String(form.level)} onChange={handleChange} required min={1} error={fieldError("level")} />
      </div>

      <Input label="Description" name="description" value={form.description || ""} onChange={handleChange} error={fieldError("description")} />

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" loading={submitting}>
          {initial ? "Update Designation" : "Add Designation"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
