"use client";

import { useState, useCallback } from "react";
import { Button, Input, Alert } from "@/components/ui";
import type { LocationFormData, LocationDetail } from "@/types";

interface LocationFormProps {
  initial?: LocationDetail | null;
  onSubmit: (data: LocationFormData) => Promise<boolean>;
  onCancel: () => void;
  formError: string;
  fieldErrors: Record<string, string[]>;
}

const EMPTY_FORM: LocationFormData = {
  name: "",
  code: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
  address: "",
  timezone: "Asia/Kolkata",
  is_headquarters: false,
};

function fromDetail(l: LocationDetail): LocationFormData {
  return {
    name: l.name,
    code: l.code,
    city: l.city,
    state: l.state,
    country: l.country,
    pincode: l.pincode || "",
    address: l.address || "",
    timezone: l.timezone,
    is_headquarters: l.is_headquarters,
  };
}

export function LocationForm({ initial, onSubmit, onCancel, formError, fieldErrors }: LocationFormProps) {
  const [form, setForm] = useState<LocationFormData>(initial ? fromDetail(initial) : EMPTY_FORM);
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
        <Input label="Location Name" name="name" value={form.name} onChange={handleChange} required error={fieldError("name")} />
        <Input label="Code" name="code" value={form.code} onChange={handleChange} required placeholder="e.g. MUM-HQ" error={fieldError("code")} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input label="Country" name="country" value={form.country} onChange={handleChange} required error={fieldError("country")} />
        <Input label="State" name="state" value={form.state} onChange={handleChange} required error={fieldError("state")} />
        <Input label="City" name="city" value={form.city} onChange={handleChange} required error={fieldError("city")} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input label="Address" name="address" value={form.address || ""} onChange={handleChange} error={fieldError("address")} />
        <Input label="Pincode" name="pincode" value={form.pincode || ""} onChange={handleChange} error={fieldError("pincode")} />
        <Input label="Timezone" name="timezone" value={form.timezone} onChange={handleChange} required placeholder="Asia/Kolkata" error={fieldError("timezone")} />
      </div>

      <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
        <input type="checkbox" name="is_headquarters" checked={form.is_headquarters} onChange={handleChange} className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500" />
        Set as headquarters
      </label>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" loading={submitting}>
          {initial ? "Update Location" : "Add Location"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
