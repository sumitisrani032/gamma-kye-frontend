"use client";

import { useState, useEffect, useCallback } from "react";
import { getUsers } from "@/services/user-management-service";
import type { ManagedUser, UserStatus } from "@/types";

interface UseUsersReturn {
  users: ManagedUser[];
  loading: boolean;
  error: string;
  statusFilter: UserStatus | undefined;
  setStatusFilter: (s: UserStatus | undefined) => void;
  refresh: () => Promise<void>;
}

export function useUsers(): UseUsersReturn {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | undefined>();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setUsers(await getUsers(statusFilter));
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { users, loading, error, statusFilter, setStatusFilter, refresh };
}
