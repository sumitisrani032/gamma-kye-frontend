"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getRole,
  updateRole,
  syncRolePermissions,
} from "@/services/role-service";
import { getGroupedPermissions } from "@/services/permission-service";
import type { RoleDetail, PermissionDetail, ApiError } from "@/types";

interface UseRoleDetailReturn {
  role: RoleDetail | null;
  allPermissions: Record<string, PermissionDetail[]>;
  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string>) => void;
  loading: boolean;
  saving: boolean;
  error: string;
  saveInfo: (name: string, description: string, rank?: number) => Promise<boolean>;
  savePermissions: () => Promise<boolean>;
}

export function useRoleDetail(id: string): UseRoleDetailReturn {
  const [role, setRole] = useState<RoleDetail | null>(null);
  const [allPermissions, setAllPermissions] = useState<
    Record<string, PermissionDetail[]>
  >({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [roleData, grouped] = await Promise.all([
          getRole(id),
          getGroupedPermissions(),
        ]);
        setRole(roleData);
        setAllPermissions(grouped);
        setSelectedIds(new Set(roleData.permissions.map((p) => p.id)));
      } catch {
        setError("Failed to load role details.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const saveInfo = useCallback(
    async (name: string, description: string, rank?: number): Promise<boolean> => {
      setSaving(true);
      setError("");
      try {
        const updated = await updateRole(id, {
          role: rank !== undefined ? { name, description, rank } : { name, description },
        });
        setRole(updated);
        return true;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.error || "Failed to update role.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [id]
  );

  const savePermissions = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    setError("");
    try {
      const updated = await syncRolePermissions(id, [...selectedIds]);
      setRole(updated);
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to update permissions.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [id, selectedIds]);

  return {
    role,
    allPermissions,
    selectedIds,
    setSelectedIds,
    loading,
    saving,
    error,
    saveInfo,
    savePermissions,
  };
}
