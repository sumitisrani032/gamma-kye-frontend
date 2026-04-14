"use client";

import { useState, useEffect } from "react";
import { listLeavePolicies } from "@/services/leave-policy-service";
import { listShifts } from "@/services/shift-service";
import type { LeavePolicySummary, Shift } from "@/types";

interface UsePolicySuggestionsReturn {
  leavePolicies: LeavePolicySummary[];
  shifts: Shift[];
  defaultShift: Shift | null;
  loading: boolean;
}

/**
 * Fetches active leave policies and shifts.
 * Used in the Policy step to show what will be auto-assigned on creation.
 */
export function usePolicySuggestions(): UsePolicySuggestionsReturn {
  const [leavePolicies, setLeavePolicies] = useState<LeavePolicySummary[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listLeavePolicies(), listShifts()])
      .then(([policies, shiftList]) => {
        setLeavePolicies(policies.filter((p) => p.is_active));
        setShifts(shiftList);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const defaultShift = shifts.find((s) => s.is_default && s.is_active) || null;

  return { leavePolicies, shifts, defaultShift, loading };
}
