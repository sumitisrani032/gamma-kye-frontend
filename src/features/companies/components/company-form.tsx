"use client";

import { useState, useCallback } from "react";
import { Button, Input, Alert } from "@/components/ui";
import type { CompanyFormData, CompanyDetail } from "@/types";

interface CompanyFormProps {
  initial?: CompanyDetail | null;
  onSubmit: (data: CompanyFormData) => Promise<boolean>;
  onCancel: () => void;
  formError: string;
  fieldErrors: Record<string, string[]>;
}

const EMPTY_FORM: CompanyFormData = {
  name: "",
  legal_name: "",
  registration_number: "",
  tax_id: "",
  country: "India",
  state: "",
  city: "",
  address: "",
  pincode: "",
  phone: "",
  email: "",
  website: "",
  is_primary: false,
};

function fromDetail(c: CompanyDetail): CompanyFormData {
  return {
    name: c.name,
    legal_name: c.legal_name,
    registration_number: c.registration_number || "",
    tax_id: c.tax_id || "",
    country: c.country,
    state: c.state,
    city: c.city,
    address: c.address || "",
    pincode: c.pincode || "",
    phone: c.phone || "",
    email: c.email || "",
    website: c.website || "",
    is_primary: c.is_primary,
  };
}

export function CompanyForm({ initial, onSubmit, onCancel, formError, fieldErrors }: CompanyFormProps) {
  const [form, setForm] = useState<CompanyFormData>(initial ? fromDetail(initial) : EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Company Name" name="name" value={form.name} onChange={handleChange} required error={fieldError("name")} />
        <Input label="Legal Name" name="legal_name" value={form.legal_name} onChange={handleChange} required error={fieldError("legal_name")} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Registration Number" name="registration_number" value={form.registration_number || ""} onChange={handleChange} error={fieldError("registration_number")} />
        <Input label="Tax ID / GSTIN" name="tax_id" value={form.tax_id || ""} onChange={handleChange} error={fieldError("tax_id")} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input label="Country" name="country" value={form.country} onChange={handleChange} required error={fieldError("country")} />
        <Input label="State" name="state" value={form.state} onChange={handleChange} required error={fieldError("state")} />
        <Input label="City" name="city" value={form.city} onChange={handleChange} required error={fieldError("city")} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Address" name="address" value={form.address || ""} onChange={handleChange} error={fieldError("address")} />
        <Input label="Pincode" name="pincode" value={form.pincode || ""} onChange={handleChange} error={fieldError("pincode")} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input label="Phone" name="phone" value={form.phone || ""} onChange={handleChange} error={fieldError("phone")} />
        <Input label="Email" name="email" type="email" value={form.email || ""} onChange={handleChange} error={fieldError("email")} />
        <Input label="Website" name="website" value={form.website || ""} onChange={handleChange} error={fieldError("website")} />
      </div>

      <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
        <input type="checkbox" name="is_primary" checked={form.is_primary} onChange={handleChange} className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500" />
        Set as primary company
      </label>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" loading={submitting}>
          {initial ? "Update Company" : "Add Company"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
