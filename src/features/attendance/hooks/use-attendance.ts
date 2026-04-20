"use client";

import { useState, useEffect, useCallback } from "react";
import { clockIn, clockOut, getToday, getMonthlyRecords, getMonthlySummary } from "@/services/attendance-service";
import { getMyProfile } from "@/services/my-profile-service";
import { getEmployeeActiveShift } from "@/services/shift-assignment-service";
import { listShifts } from "@/services/shift-service";
import { invalidateRequests, subscribeToInvalidate } from "@/lib/invalidate";
import type { AttendanceRecord, AttendanceState, AttendanceSummary, Shift, ApiError } from "@/types";

interface UseAttendanceReturn {
  today: AttendanceRecord | null;
  state: AttendanceState;
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
}

export function useAttendance(): UseAttendanceReturn {
  const now = new Date();
  const [today, setToday] = useState<AttendanceRecord | null>(null);
  const [state, setState] = useState<AttendanceState>("not_started");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [shift, setShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [clocking, setClocking] = useState(false);
  const [error, setError] = useState("");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const loadToday = useCallback(async () => {
    try {
      const data = await getToday();
      setToday(data.attendance);
      setState(data.state);
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
    try {
      const profile = await getMyProfile();
      const assignment = await getEmployeeActiveShift(profile.employee.id);
      if (assignment) { setShift(assignment.shift); return; }
    } catch {}
    try {
      const shifts = await listShifts();
      setShift(shifts.find((s) => s.is_default && s.is_active) || shifts[0] || null);
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([loadToday(), loadMonthly(), loadShift()]).finally(() => setLoading(false));
  }, [loadToday, loadMonthly, loadShift]);

  useEffect(() => {
    return subscribeToInvalidate(["today", "attendance", "calendar"], () => {
      loadToday();
      loadMonthly();
    });
  }, [loadToday, loadMonthly]);

  const handleClockIn = useCallback(async () => {
    setError("");
    setClocking(true);
    try {
      await clockIn("web");
      await loadToday();
      await loadMonthly();
      invalidateRequests(["today", "attendance", "calendar"]);
    } catch (err) {
      setError((err as ApiError).error || "Failed to clock in.");
    } finally {
      setClocking(false);
    }
  }, [loadToday, loadMonthly]);

  const handleClockOut = useCallback(async () => {
    setError("");
    setClocking(true);
    try {
      await clockOut();
      await loadToday();
      await loadMonthly();
      invalidateRequests(["today", "attendance", "calendar"]);
    } catch (err) {
      setError((err as ApiError).error || "Failed to clock out.");
    } finally {
      setClocking(false);
    }
  }, [loadToday, loadMonthly]);

  return {
    today, state, records, summary, shift, loading, clocking, error,
    year, month, setYear, setMonth,
    handleClockIn, handleClockOut,
  };
}
