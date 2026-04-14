"use client";

import { useState, useCallback } from "react";
import { Button, Input, Alert } from "@/components/ui";
import type { GradeFormData, Grade } from "@/types";

interface GradeFormProps {
  initial?: Grade | null;
  onSubmit: (data: GradeFormData) => Promise<boolean>;
  onCancel: () => void;
  formError: string;
  fieldErrors: Record<string, string[]>;
}

const EMPTY_FORM: GradeFormData = {
  name: "",
  code: "",
  rank: 1,
  description: "",
};

function fromGrade(g: Grade): GradeFormData {
  return {
    name: g.name,
    code: g.code || "",
    rank: g.rank,
    description: g.description || "",
  };
}

export function GradeForm({ initial, onSubmit, onCancel, formError, fieldErrors }: GradeFormProps) {
  const [form, setForm] = useState<GradeFormData>(initial ? fromGrade(initial) : EMPTY_FORM);
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
        <Input label="Code" name="code" value={form.code || ""} onChange={handleChange} placeholder="e.g. L1" error={fieldError("code")} />
        <Input label="Rank" name="rank" type="number" value={String(form.rank)} onChange={handleChange} required min={1} error={fieldError("rank")} />
      </div>

      <Input label="Description" name="description" value={form.description || ""} onChange={handleChange} error={fieldError("description")} />

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" loading={submitting}>
          {initial ? "Update Grade" : "Add Grade"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
