"use client";

import { useState, useEffect } from "react";
import { listCompanies } from "@/services/company-service";
import { listDepartments } from "@/services/department-service";
import { listDesignations } from "@/services/designation-service";
import { listGrades } from "@/services/grade-service";
import { listLocations } from "@/services/location-service";
import type { CompanySummary, DepartmentSummary, Designation, Grade, LocationSummary } from "@/types";

interface UseOrgLookupsReturn {
  companies: CompanySummary[];
  departments: DepartmentSummary[];
  designations: Designation[];
  grades: Grade[];
  locations: LocationSummary[];
  loading: boolean;
}

/**
 * Fetches all organization lookup data needed for the onboard wizard.
 * Single request on mount — data is shared across steps.
 */
export function useOrgLookups(): UseOrgLookupsReturn {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [locations, setLocations] = useState<LocationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      listCompanies(),
      listDepartments(),
      listDesignations(),
      listGrades(),
      listLocations(),
    ])
      .then(([c, d, des, g, l]) => {
        setCompanies(c);
        setDepartments(d);
        setDesignations(des);
        setGrades(g);
        setLocations(l);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { companies, departments, designations, grades, locations, loading };
}
