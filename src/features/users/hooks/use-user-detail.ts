"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getUser,
  updateUser,
  assignRole,
  removeRole,
} from "@/services/user-management-service";
import { getRoles } from "@/services/role-service";
import type {
  ManagedUser,
  PermissionDetail,
  RoleSummary,
  UserStatus,
  ApiError,
} from "@/types";

interface UseUserDetailReturn {
  user: ManagedUser | null;
  permissions: PermissionDetail[];
  allRoles: RoleSummary[];
  loading: boolean;
  saving: boolean;
  error: string;
  updateStatus: (status: UserStatus) => Promise<boolean>;
  addRole: (roleId: string) => Promise<boolean>;
  deleteRole: (roleId: string) => Promise<boolean>;
}

export function useUserDetail(id: string): UseUserDetailReturn {
  const [user, setUser] = useState<ManagedUser | null>(null);
  const [permissions, setPermissions] = useState<PermissionDetail[]>([]);
  const [allRoles, setAllRoles] = useState<RoleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [detail, roles] = await Promise.all([getUser(id), getRoles()]);
      setUser(detail.user);
      setPermissions(detail.permissions);
      setAllRoles(roles);
    } catch {
      setError("Failed to load user details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const updateStatus = useCallback(
    async (status: UserStatus): Promise<boolean> => {
      setSaving(true);
      setError("");
      try {
        const updated = await updateUser(id, { user: { status } });
        setUser(updated);
        return true;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.error || "Failed to update user.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [id]
  );

  const addRole = useCallback(
    async (roleId: string): Promise<boolean> => {
      setSaving(true);
      setError("");
      try {
        await assignRole(id, roleId);
        // Refetch to get updated roles + effective permissions
        const detail = await getUser(id);
        setUser(detail.user);
        setPermissions(detail.permissions);
        return true;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.error || "Failed to assign role.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [id]
  );

  const deleteRole = useCallback(
    async (roleId: string): Promise<boolean> => {
      setSaving(true);
      setError("");
      try {
        await removeRole(id, roleId);
        const detail = await getUser(id);
        setUser(detail.user);
        setPermissions(detail.permissions);
        return true;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.error || "Failed to remove role.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [id]
  );

  return {
    user,
    permissions,
    allRoles,
    loading,
    saving,
    error,
    updateStatus,
    addRole,
    deleteRole,
  };
}
