"use client";

import { useState, useEffect, useCallback } from "react";
import { createRole } from "@/services/role-service";
import { getGroupedPermissions } from "@/services/permission-service";
import type { PermissionDetail, ApiError } from "@/types";

interface UseCreateRoleReturn {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  allPermissions: Record<string, PermissionDetail[]>;
  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string>) => void;
  loading: boolean;
  saving: boolean;
  error: string;
  fieldErrors: Record<string, string[]>;
  handleSubmit: () => Promise<boolean>;
}

export function useCreateRole(): UseCreateRoleReturn {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [allPermissions, setAllPermissions] = useState<
    Record<string, PermissionDetail[]>
  >({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    (async () => {
      try {
        setAllPermissions(await getGroupedPermissions());
      } catch {
        setError("Failed to load permissions.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    setError("");
    setFieldErrors({});
    try {
      await createRole({
        role: { name, description },
        permission_ids: [...selectedIds],
      });
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors) {
        setFieldErrors(apiError.errors);
      } else {
        setError(apiError.error || "Failed to create role.");
      }
      return false;
    } finally {
      setSaving(false);
    }
  }, [name, description, selectedIds]);

  return {
    name,
    setName,
    description,
    setDescription,
    allPermissions,
    selectedIds,
    setSelectedIds,
    loading,
    saving,
    error,
    fieldErrors,
    handleSubmit,
  };
}
