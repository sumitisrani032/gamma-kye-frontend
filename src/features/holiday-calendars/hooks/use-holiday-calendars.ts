"use client";

import { useState, useEffect, useCallback } from "react";
import {
  listHolidayCalendars,
  getHolidayCalendar,
  createHolidayCalendar,
  deleteHolidayCalendar,
  addHoliday,
  updateHoliday,
  deleteHoliday,
} from "@/services/holiday-calendar-service";
import type {
  HolidayCalendarSummary,
  HolidayCalendarDetail,
  HolidayCalendarFormData,
  HolidayFormData,
  ApiError,
} from "@/types";

interface UseHolidayCalendarsReturn {
  calendars: HolidayCalendarSummary[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  addCalendar: (data: HolidayCalendarFormData) => Promise<boolean>;
  removeCalendar: (id: string) => Promise<boolean>;
  fetchDetail: (id: string) => Promise<HolidayCalendarDetail | null>;
  addHol: (calendarId: string, data: HolidayFormData) => Promise<boolean>;
  updateHol: (calendarId: string, holidayId: string, data: Partial<HolidayFormData>) => Promise<boolean>;
  removeHol: (calendarId: string, holidayId: string) => Promise<boolean>;
  formError: string;
  fieldErrors: Record<string, string[]>;
  clearFormErrors: () => void;
}

export function useHolidayCalendars(): UseHolidayCalendarsReturn {
  const [calendars, setCalendars] = useState<HolidayCalendarSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const clearFormErrors = useCallback(() => {
    setFormError("");
    setFieldErrors({});
  }, []);

  const refresh = useCallback(async () => {
    setError("");
    try {
      const data = await listHolidayCalendars();
      setCalendars(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to load holiday calendars.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleError = useCallback((err: unknown) => {
    const apiError = err as ApiError;
    if (apiError.errors) setFieldErrors(apiError.errors);
    else setFormError(apiError.error || "Operation failed.");
  }, []);

  const addCalendar = useCallback(async (data: HolidayCalendarFormData): Promise<boolean> => {
    clearFormErrors();
    try {
      await createHolidayCalendar(data);
      await refresh();
      return true;
    } catch (err) { handleError(err); return false; }
  }, [refresh, clearFormErrors, handleError]);

  const removeCalendar = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteHolidayCalendar(id);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to delete calendar.");
      return false;
    }
  }, [refresh]);

  const fetchDetail = useCallback(async (id: string): Promise<HolidayCalendarDetail | null> => {
    try { return await getHolidayCalendar(id); }
    catch { return null; }
  }, []);

  const addHol = useCallback(async (calendarId: string, data: HolidayFormData): Promise<boolean> => {
    clearFormErrors();
    try {
      await addHoliday(calendarId, data);
      return true;
    } catch (err) { handleError(err); return false; }
  }, [clearFormErrors, handleError]);

  const updateHol = useCallback(async (calendarId: string, holidayId: string, data: Partial<HolidayFormData>): Promise<boolean> => {
    clearFormErrors();
    try {
      await updateHoliday(calendarId, holidayId, data);
      return true;
    } catch (err) { handleError(err); return false; }
  }, [clearFormErrors, handleError]);

  const removeHol = useCallback(async (calendarId: string, holidayId: string): Promise<boolean> => {
    try {
      await deleteHoliday(calendarId, holidayId);
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to delete holiday.");
      return false;
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { calendars, loading, error, refresh, addCalendar, removeCalendar, fetchDetail, addHol, updateHol, removeHol, formError, fieldErrors, clearFormErrors };
}
