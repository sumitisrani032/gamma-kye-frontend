"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getEmployee,
  updateEmployee,
  promoteEmployee,
  transferEmployee,
  changeManager,
  offboardEmployee,
  assignRole,
  removeRole,
  updateAccount,
  setPassword as setPasswordApi,
} from "@/services/employee-service";
import type { EmployeeDetail, PromoteData, TransferData, OffboardData, ApiError } from "@/types";

interface UseEmployeeDetailReturn {
  employee: EmployeeDetail | null;
  loading: boolean;
  error: string;
  actionError: string;
  refresh: () => Promise<void>;
  update: (fields: Record<string, unknown>) => Promise<boolean>;
  promote: (data: PromoteData) => Promise<boolean>;
  transfer: (data: TransferData) => Promise<boolean>;
  changeReportingManager: (managerId: string, effectiveDate: string) => Promise<boolean>;
  offboard: (data: OffboardData) => Promise<boolean>;
  addRole: (roleId: string) => Promise<boolean>;
  deleteRole: (roleId: string) => Promise<boolean>;
  setAccountStatus: (status: string) => Promise<boolean>;
  setPassword: (password: string, passwordConfirmation: string) => Promise<boolean>;
}

export function useEmployeeDetail(id: string): UseEmployeeDetailReturn {
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    try {
      const data = await getEmployee(id);
      setEmployee(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to load employee.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleAction = useCallback(async <T>(fn: () => Promise<T>): Promise<boolean> => {
    setActionError("");
    try {
      await fn();
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors) {
        // Flatten field-level errors into a readable message
        const messages = Object.entries(apiError.errors)
          .flatMap(([field, msgs]) => msgs.map((msg) => `${field} ${msg}`));
        setActionError(messages.join(". "));
      } else {
        setActionError(apiError.error || "Action failed.");
      }
      return false;
    }
  }, [refresh]);

  const update = useCallback((fields: Record<string, unknown>) =>
    handleAction(() => updateEmployee(id, fields)), [id, handleAction]);

  const promote = useCallback((data: PromoteData) =>
    handleAction(() => promoteEmployee(id, data)), [id, handleAction]);

  const transfer = useCallback((data: TransferData) =>
    handleAction(() => transferEmployee(id, data)), [id, handleAction]);

  const changeReportingManager = useCallback((managerId: string, effectiveDate: string) =>
    handleAction(() => changeManager(id, managerId, effectiveDate)), [id, handleAction]);

  const offboard = useCallback((data: OffboardData) =>
    handleAction(() => offboardEmployee(id, data)), [id, handleAction]);

  const addRole = useCallback((roleId: string) =>
    handleAction(() => assignRole(id, roleId)), [id, handleAction]);

  const deleteRole = useCallback((roleId: string) =>
    handleAction(async () => { await removeRole(id, roleId); }), [id, handleAction]);

  const setAccountStatus = useCallback((status: string) =>
    handleAction(() => updateAccount(id, status)), [id, handleAction]);

  const setPassword = useCallback((password: string, passwordConfirmation: string) =>
    handleAction(async () => { await setPasswordApi(id, password, passwordConfirmation); }), [id, handleAction]);

  return { employee, loading, error, actionError, refresh, update, promote, transfer, changeReportingManager, offboard, addRole, deleteRole, setAccountStatus, setPassword };
}
