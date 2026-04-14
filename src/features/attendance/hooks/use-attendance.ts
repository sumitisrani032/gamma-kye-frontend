"use client";

import { useState, useEffect, useCallback } from "react";
import { clockIn, clockOut, getToday, getMonthlyRecords, getMonthlySummary } from "@/services/attendance-service";
import { getMyProfile } from "@/services/my-profile-service";
import { getEmployeeActiveShift } from "@/services/shift-assignment-service";
import { listShifts } from "@/services/shift-service";
import type { AttendanceRecord, AttendanceSummary, Shift, ApiError } from "@/types";

interface UseAttendanceReturn {
  today: AttendanceRecord | null;
  records: AttendanceRecord[];
  summary: AttendanceSummary | null;
  shift: Shift | null;
  loading: boolean;
  clocking: boolean;
  error: string;
  year: number;
  month: number;
  setYear: (y: number) => void;
  setMonth: (m: number) => void;
  handleClockIn: () => Promise<void>;
  handleClockOut: () => Promise<void>;
  isClockedIn: boolean;
}

export function useAttendance(): UseAttendanceReturn {
  const now = new Date();
  const [today, setToday] = useState<AttendanceRecord | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [shift, setShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [clocking, setClocking] = useState(false);
  const [error, setError] = useState("");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const isClockedIn = !!today?.clock_in && !today?.clock_out;

  const loadToday = useCallback(async () => {
    try {
      const data = await getToday();
      setToday(data);
    } catch {}
  }, []);

  const loadMonthly = useCallback(async () => {
    try {
      const [recs, sum] = await Promise.all([
        getMonthlyRecords(year, month),
        getMonthlySummary(year, month),
      ]);
      setRecords(recs);
      setSummary(sum);
    } catch {}
  }, [year, month]);

  const loadShift = useCallback(async () => {
    // 1. Try employee's active shift assignment
    try {
      const profile = await getMyProfile();
      const assignment = await getEmployeeActiveShift(profile.employee.id);
      if (assignment) {
        setShift(assignment.shift);
        return;
      }
    } catch { /* not authorized or no assignment */ }

    // 2. Fallback: default shift from /manage/shifts
    try {
      const shifts = await listShifts();
      const defaultShift = shifts.find((s) => s.is_default && s.is_active) || shifts[0] || null;
      setShift(defaultShift);
    } catch { /* non-admin, skip */ }
  }, []);

  useEffect(() => {
    Promise.all([loadToday(), loadMonthly(), loadShift()]).finally(() => setLoading(false));
  }, [loadToday, loadMonthly, loadShift]);

  const handleClockIn = useCallback(async () => {
    setError("");
    setClocking(true);
    try {
      const data = await clockIn("web");
      setToday(data);
      await loadMonthly();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to clock in.");
    } finally {
      setClocking(false);
    }
  }, [loadMonthly]);

  const handleClockOut = useCallback(async () => {
    setError("");
    setClocking(true);
    try {
      const data = await clockOut();
      setToday(data);
      await loadMonthly();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to clock out.");
    } finally {
      setClocking(false);
    }
  }, [loadMonthly]);

  return {
    today, records, summary, shift, loading, clocking, error,
    year, month, setYear, setMonth,
    handleClockIn, handleClockOut, isClockedIn,
  };
}
