"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Alert, Card, CardContent } from "@/components/ui";
import { onboardEmployee } from "@/services/employee-service";
import { listCompanies } from "@/services/company-service";
import { listDepartments } from "@/services/department-service";
import { listDesignations } from "@/services/designation-service";
import { listGrades } from "@/services/grade-service";
import { listLocations } from "@/services/location-service";
import { listEmployees } from "@/services/employee-service";
import { getRoles } from "@/services/role-service";
import { assignRole } from "@/services/employee-service";
import type {
  CompanySummary, DepartmentSummary, Designation, Grade, LocationSummary,
  EmployeeListItem, EmployeeOnboardData, EmploymentType, RoleSummary, ApiError,
} from "@/types";

const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "intern", label: "Intern" },
  { value: "consultant", label: "Consultant" },
];

const GENDER_OPTIONS = [
  { value: "", label: "Select..." },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export function EmployeeOnboardForm() {
  const router = useRouter();

  // Lookup data
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [locations, setLocations] = useState<LocationSummary[]>([]);
  const [managers, setManagers] = useState<EmployeeListItem[]>([]);
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [lookupLoading, setLookupLoading] = useState(true);

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [designationId, setDesignationId] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [dateOfJoining, setDateOfJoining] = useState("");
  const [employmentType, setEmploymentType] = useState<EmploymentType>("full_time");
  const [gender, setGender] = useState("");
  const [managerId, setManagerId] = useState("");
  const [roleId, setRoleId] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    Promise.all([
      listCompanies(), listDepartments(), listDesignations(),
      listGrades(), listLocations(), listEmployees({ active: true }),
      getRoles(),
    ]).then(([c, d, des, g, l, m, r]) => {
      setCompanies(c); setDepartments(d); setDesignations(des);
      setGrades(g); setLocations(l); setManagers(m); setRoles(r);
      if (c.length > 0) setCompanyId(c[0].id);
    }).catch(() => {}).finally(() => setLookupLoading(false));
  }, []);

  const fieldError = (f: string) => fieldErrors[f]?.[0];

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSubmitting(true);

    const payload: EmployeeOnboardData = {
      employee: {
        first_name: firstName,
        last_name: lastName,
        email_official: email,
        company_id: companyId,
        department_id: departmentId,
        designation_id: designationId,
        grade_id: gradeId || undefined,
        location_id: locationId,
        date_of_joining: dateOfJoining,
        employment_type: employmentType,
        gender: gender || undefined,
        reporting_manager_id: managerId || undefined,
        phone: phone || undefined,
      },
    };

    try {
      const emp = await onboardEmployee(payload);

      // Assign additional role if selected (beyond default "Employee" role)
      if (roleId) {
        try {
          await assignRole(emp.id, roleId);
        } catch {
          // Non-critical — role can be assigned later from detail page
        }
      }

      router.push(`/employees/${emp.id}`);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors) setFieldErrors(apiError.errors);
      else setError(apiError.error || "Failed to onboard employee.");
    } finally {
      setSubmitting(false);
    }
  }, [firstName, lastName, email, phone, companyId, departmentId, designationId, gradeId, locationId, dateOfJoining, employmentType, gender, managerId, roleId, router]);

  const toOptions = (items: { id: string; name: string }[]) =>
    items.map((i) => ({ value: i.id, label: i.name }));

  // Filter out the "Employee" system role since it's auto-assigned
  const additionalRoles = roles.filter((r) => r.name !== "Employee");

  if (lookupLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Info card */}
      <Card>
        <CardContent className="text-sm text-text-secondary space-y-1">
          <p className="font-medium text-text-primary">How onboarding works:</p>
          <ul className="list-disc list-inside space-y-0.5 text-xs">
            <li>A <strong>user account</strong> is automatically created with the official email</li>
            <li>The <strong>Employee</strong> role is auto-assigned — add an additional role below for managers/HR</li>
            <li>Leave balances are initialized based on active leave policies</li>
            <li>The default work shift is assigned automatically</li>
            <li>Set a <strong>Reporting Manager</strong> to build the org hierarchy</li>
          </ul>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <Alert variant="error">{error}</Alert>}

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-text-primary uppercase tracking-wider">Personal Info</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required error={fieldError("first_name")} />
            <Input label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required error={fieldError("last_name")} />
            <Select label="Gender" name="gender" value={gender} onChange={(e) => setGender(e.target.value)} options={GENDER_OPTIONS} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Official Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@company.com" error={fieldError("email_official")} />
            <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} error={fieldError("phone")} />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-text-primary uppercase tracking-wider">Organization</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {companies.length > 0 && <Select label="Company" name="company_id" value={companyId} onChange={(e) => setCompanyId(e.target.value)} options={toOptions(companies)} required error={fieldError("company_id")} />}
            {departments.length > 0 && <Select label="Department" name="department_id" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} options={[{ value: "", label: "Select department..." }, ...toOptions(departments)]} required error={fieldError("department_id")} />}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {designations.length > 0 && <Select label="Designation" name="designation_id" value={designationId} onChange={(e) => setDesignationId(e.target.value)} options={[{ value: "", label: "Select designation..." }, ...toOptions(designations)]} required error={fieldError("designation_id")} />}
            {grades.length > 0 && <Select label="Grade" name="grade_id" value={gradeId} onChange={(e) => setGradeId(e.target.value)} options={[{ value: "", label: "Select grade..." }, ...toOptions(grades)]} error={fieldError("grade_id")} />}
            {locations.length > 0 && <Select label="Location" name="location_id" value={locationId} onChange={(e) => setLocationId(e.target.value)} options={[{ value: "", label: "Select location..." }, ...toOptions(locations)]} required error={fieldError("location_id")} />}
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-text-primary uppercase tracking-wider">Employment & Hierarchy</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Date of Joining" type="date" value={dateOfJoining} onChange={(e) => setDateOfJoining(e.target.value)} required error={fieldError("date_of_joining")} />
            <Select label="Employment Type" name="employment_type" value={employmentType} onChange={(e) => setEmploymentType(e.target.value as EmploymentType)} options={EMPLOYMENT_TYPES} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Reporting Manager"
              name="reporting_manager_id"
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              options={[
                { value: "", label: "None (top-level)" },
                ...managers.map((m) => ({
                  value: m.id,
                  label: `${m.full_name} (${m.employee_number}) — ${m.designation?.name || ""}`,
                })),
              ]}
              error={fieldError("reporting_manager_id")}
            />
            {additionalRoles.length > 0 && (
              <Select
                label="Additional Role (optional)"
                name="role_id"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                options={[
                  { value: "", label: "Employee only (default)" },
                  ...additionalRoles.map((r) => ({ value: r.id, label: r.name })),
                ]}
              />
            )}
          </div>
          <p className="text-xs text-text-muted">
            Tip: Onboard managers first, then their reports. The reporting manager dropdown shows all existing employees.
          </p>
        </fieldset>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" size="lg" loading={submitting}>Onboard Employee</Button>
          <Button type="button" variant="secondary" size="lg" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
