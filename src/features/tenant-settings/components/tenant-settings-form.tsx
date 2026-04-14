"use client";

import { useState, useEffect } from "react";
import { Button, Card, CardContent, CardHeader, Input, Select, Alert } from "@/components/ui";
import { useTenantSettings } from "../hooks/use-tenant-settings";
import type { TenantSettings } from "@/types";

const TIMEZONE_OPTIONS = [
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST)" },
  { value: "America/New_York", label: "America/New_York (EST)" },
  { value: "America/Chicago", label: "America/Chicago (CST)" },
  { value: "America/Denver", label: "America/Denver (MST)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST)" },
  { value: "Europe/London", label: "Europe/London (GMT)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST)" },
  { value: "UTC", label: "UTC" },
];

const CURRENCY_OPTIONS = [
  { value: "INR", label: "INR (₹)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "AED", label: "AED (د.إ)" },
  { value: "SGD", label: "SGD (S$)" },
  { value: "AUD", label: "AUD (A$)" },
];

const LOCALE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
];

const DATE_FORMAT_OPTIONS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

const TIME_FORMAT_OPTIONS = [
  { value: "12h", label: "12 hour" },
  { value: "24h", label: "24 hour" },
];

const FY_START_OPTIONS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
].map((m) => ({ value: m, label: m }));

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
      />
      {label}
    </label>
  );
}

export function TenantSettingsForm() {
  const { settings, loading, saving, error, formError, save } = useTenantSettings();
  const [form, setForm] = useState<Partial<TenantSettings>>({});
  const [dirty, setDirty] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (settings) setForm({ ...settings });
  }, [settings]);

  const update = <K extends keyof TenantSettings>(key: K, value: TenantSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setSuccess(false);
  };

  const handleSave = async () => {
    const ok = await save(form);
    if (ok) {
      setDirty(false);
      setSuccess(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error) return <Alert variant="error">{error}</Alert>;

  return (
    <div className="space-y-6 max-w-3xl">
      {formError && <Alert variant="error">{formError}</Alert>}
      {success && <Alert variant="success">Settings saved successfully.</Alert>}

      {/* Regional */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">Regional Settings</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Timezone" name="timezone" value={form.timezone || ""} onChange={(e) => update("timezone", e.target.value)} options={TIMEZONE_OPTIONS} />
            <Select label="Currency" name="currency" value={form.currency || ""} onChange={(e) => update("currency", e.target.value)} options={CURRENCY_OPTIONS} />
            <Select label="Language" name="locale" value={form.locale || ""} onChange={(e) => update("locale", e.target.value)} options={LOCALE_OPTIONS} />
            <Select label="Financial Year Start" name="financial_year_start" value={form.financial_year_start || ""} onChange={(e) => update("financial_year_start", e.target.value)} options={FY_START_OPTIONS} />
          </div>
        </CardContent>
      </Card>

      {/* Display */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">Display Format</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Date Format" name="date_format" value={form.date_format || ""} onChange={(e) => update("date_format", e.target.value)} options={DATE_FORMAT_OPTIONS} />
            <Select label="Time Format" name="time_format" value={form.time_format || ""} onChange={(e) => update("time_format", e.target.value)} options={TIME_FORMAT_OPTIONS} />
            <Input label="Employee Number Format" name="employee_number_format" value={form.employee_number_format || ""} onChange={(e) => update("employee_number_format", e.target.value)} placeholder="EMP-XXXXXX" />
          </div>
        </CardContent>
      </Card>

      {/* Policies */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">Policy Settings</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Max Leave Advance Days" type="number" name="max_leave_advance_days" value={String(form.max_leave_advance_days ?? "")} onChange={(e) => update("max_leave_advance_days", Number(e.target.value))} min="1" />
            <Input label="Minimum Password Length" type="number" name="password_min_length" value={String(form.password_min_length ?? "")} onChange={(e) => update("password_min_length", Number(e.target.value))} min="6" />
          </div>
          <div className="space-y-3 pt-2">
            <Toggle label="Auto clock-out attendance" checked={form.attendance_auto_clockout ?? false} onChange={(v) => update("attendance_auto_clockout", v)} />
            <Toggle label="Leave application requires reason" checked={form.leave_requires_reason ?? false} onChange={(v) => update("leave_requires_reason", v)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} loading={saving} disabled={!dirty}>Save Settings</Button>
        {dirty && <span className="text-xs text-text-muted">You have unsaved changes</span>}
      </div>
    </div>
  );
}
