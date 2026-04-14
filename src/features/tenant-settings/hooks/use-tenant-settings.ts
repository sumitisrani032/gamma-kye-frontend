"use client";

import { useState, useEffect, useCallback } from "react";
import { getTenantSettings, updateTenantSettings } from "@/services/tenant-settings-service";
import type { TenantSettings, ApiError } from "@/types";

interface UseTenantSettingsReturn {
  settings: TenantSettings | null;
  loading: boolean;
  saving: boolean;
  error: string;
  formError: string;
  refresh: () => Promise<void>;
  save: (updates: Partial<TenantSettings>) => Promise<boolean>;
}

export function useTenantSettings(): UseTenantSettingsReturn {
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    try {
      const data = await getTenantSettings();
      setSettings(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const save = useCallback(async (updates: Partial<TenantSettings>): Promise<boolean> => {
    setSaving(true);
    setFormError("");
    try {
      const data = await updateTenantSettings(updates);
      setSettings(data);
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      setFormError(apiError.error || "Failed to save settings.");
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return { settings, loading, saving, error, formError, refresh, save };
}
