"use client";

import { useState, useEffect, useCallback } from "react";
import {
  listLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from "@/services/location-service";
import type { LocationSummary, LocationFormData, ApiError } from "@/types";

interface UseLocationsReturn {
  locations: LocationSummary[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  add: (data: LocationFormData) => Promise<boolean>;
  update: (id: string, data: Partial<LocationFormData>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  formError: string;
  fieldErrors: Record<string, string[]>;
  clearFormErrors: () => void;
}

export function useLocations(): UseLocationsReturn {
  const [locations, setLocations] = useState<LocationSummary[]>([]);
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
      const data = await listLocations();
      setLocations(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to load locations.");
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(async (data: LocationFormData): Promise<boolean> => {
    clearFormErrors();
    try {
      await createLocation(data);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors) setFieldErrors(apiError.errors);
      else setFormError(apiError.error || "Failed to create location.");
      return false;
    }
  }, [refresh, clearFormErrors]);

  const update = useCallback(async (id: string, data: Partial<LocationFormData>): Promise<boolean> => {
    clearFormErrors();
    try {
      await updateLocation(id, data);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors) setFieldErrors(apiError.errors);
      else setFormError(apiError.error || "Failed to update location.");
      return false;
    }
  }, [refresh, clearFormErrors]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteLocation(id);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to delete location.");
      return false;
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { locations, loading, error, refresh, add, update, remove, formError, fieldErrors, clearFormErrors };
}
