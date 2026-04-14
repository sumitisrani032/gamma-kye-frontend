"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getMyProfile,
  updateMyProfile,
  getPersonalDetails,
  updatePersonalDetails,
  getBankDetails,
  getLeaveBalances,
  getAttendanceSummary,
} from "@/services/my-profile-service";
import type {
  EmployeeDetail,
  PersonalDetail,
  PersonalDetailFormData,
  BankDetail,
  LeaveBalance,
  AttendanceSummary,
  ApiError,
} from "@/types";

interface UseMyProfileReturn {
  employee: EmployeeDetail | null;
  personalDetail: PersonalDetail | null;
  bankDetails: BankDetail[];
  leaveBalances: LeaveBalance[];
  attendanceSummary: AttendanceSummary | null;
  loading: boolean;
  error: string;
  actionError: string;
  updateProfile: (fields: Record<string, unknown>) => Promise<boolean>;
  updatePersonal: (data: PersonalDetailFormData) => Promise<boolean>;
  loadLeaveBalances: () => Promise<void>;
  loadAttendance: (year: number, month: number) => Promise<void>;
  loadBankDetails: () => Promise<void>;
}

export function useMyProfile(): UseMyProfileReturn {
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [personalDetail, setPersonalDetail] = useState<PersonalDetail | null>(null);
  const [bankDetails, setBankDetails] = useState<BankDetail[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  // Load profile + personal details on mount
  useEffect(() => {
    (async () => {
      try {
        const [profile, personal] = await Promise.all([
          getMyProfile(),
          getPersonalDetails(),
        ]);
        setEmployee(profile.employee);
        setPersonalDetail(profile.personal_detail || personal);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.error || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateProfile = useCallback(async (fields: Record<string, unknown>): Promise<boolean> => {
    setActionError("");
    try {
      const updated = await updateMyProfile(fields);
      setEmployee(updated);
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      setActionError(apiError.error || "Failed to update profile.");
      return false;
    }
  }, []);

  const updatePersonal = useCallback(async (data: PersonalDetailFormData): Promise<boolean> => {
    setActionError("");
    try {
      const updated = await updatePersonalDetails(data);
      setPersonalDetail(updated);
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      setActionError(apiError.error || "Failed to update personal details.");
      return false;
    }
  }, []);

  const loadLeaveBalances = useCallback(async () => {
    try {
      const data = await getLeaveBalances();
      setLeaveBalances(data);
    } catch {}
  }, []);

  const loadAttendance = useCallback(async (year: number, month: number) => {
    try {
      const data = await getAttendanceSummary(year, month);
      setAttendanceSummary(data);
    } catch {}
  }, []);

  const loadBankDetails = useCallback(async () => {
    try {
      const data = await getBankDetails();
      setBankDetails(data);
    } catch {}
  }, []);

  return {
    employee, personalDetail, bankDetails, leaveBalances, attendanceSummary,
    loading, error, actionError,
    updateProfile, updatePersonal, loadLeaveBalances, loadAttendance, loadBankDetails,
  };
}
