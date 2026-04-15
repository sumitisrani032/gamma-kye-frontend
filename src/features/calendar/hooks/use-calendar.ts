"use client";

import { useState, useEffect, useCallback } from "react";
import { getMonthlyCalendar, getYearHolidays } from "@/services/calendar-service";
import { clockIn, clockOut } from "@/services/attendance-service";
import type { ApiError } from "@/types";
import type { MonthlyCalendar, YearHoliday } from "@/services/calendar-service";

interface UseCalendarReturn {
  calendar: MonthlyCalendar | null;
  yearHolidays: YearHoliday[];
  loading: boolean;
  error: string;
  year: number;
  month: number;
  setYear: (y: number) => void;
  setMonth: (m: number) => void;
  prevMonth: () => void;
  nextMonth: () => void;
  refresh: () => Promise<void>;
  handleClockIn: () => Promise<void>;
  handleClockOut: () => Promise<void>;
  clocking: boolean;
}

export function useCalendar(): UseCalendarReturn {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [calendar, setCalendar] = useState<MonthlyCalendar | null>(null);
  const [yearHolidays, setYearHolidays] = useState<YearHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clocking, setClocking] = useState(false);

  const refresh = useCallback(async () => {
    setError("");
    try {
      const data = await getMonthlyCalendar(year, month);
      setCalendar(data);
    } catch (err) {
      setError((err as ApiError).error || "Failed to load calendar.");
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  const loadHolidays = useCallback(async () => {
    try {
      const data = await getYearHolidays(year);
      setYearHolidays(data);
    } catch {}
  }, [year]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { loadHolidays(); }, [loadHolidays]);

  const prevMonth = useCallback(() => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }, [month]);

  const nextMonth = useCallback(() => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }, [month]);

  const handleClockIn = useCallback(async () => {
    setClocking(true);
    try { await clockIn("web"); await refresh(); }
    catch (err) { setError((err as ApiError).error || "Failed to clock in."); }
    finally { setClocking(false); }
  }, [refresh]);

  const handleClockOut = useCallback(async () => {
    setClocking(true);
    try { await clockOut(); await refresh(); }
    catch (err) { setError((err as ApiError).error || "Failed to clock out."); }
    finally { setClocking(false); }
  }, [refresh]);

  return { calendar, yearHolidays, loading, error, year, month, setYear, setMonth, prevMonth, nextMonth, refresh, handleClockIn, handleClockOut, clocking };
}
