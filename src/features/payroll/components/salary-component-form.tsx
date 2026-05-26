"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Input, Select } from "@/components/ui";
import { listEmployeesPaginated } from "@/services/employee-service";
import { useCreateEmployeeSalary, useEmployeeSalariesList, useSalaryComponentsList, useUpdateEmployeeSalary } from "@/features/payroll/hooks";
import {
  createEmployeeSalaryComponent,
  deleteEmployeeSalaryComponent,
  listEmployeeSalaryComponents,
} from "@/services/payroll-service";
import type { EmployeeListItem, EmployeeSalary, Pagination, SalaryComponent } from "@/types";

const salarySchema = z.object({
  employee_id: z.string().min(1, "Select an employee."),
  annual_ctc: z.string().trim().min(1, "Annual CTC is required.").refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Annual CTC must be greater than 0."),
  currency: z.string().min(1, "Currency is required."),
  year: z.string().trim().min(1, "Year is required.").refine((v) => {
    const n = Number(v);
    return !isNaN(n) && Number.isInteger(n) && n >= 2000 && n <= 2100;
  }, "Enter a valid year."),
  status: z.enum(["draft", "approved", "paid"]),
  effective_from: z.string().min(1, "Effective from date is required."),
  effective_to: z.string().optional(),
  remarks: z.string().trim().max(500, "Remarks must be under 500 characters.").optional().or(z.literal("")),
});

type SalaryFormValues = z.infer<typeof salarySchema>;

interface ComponentAllocation {
  component_id: number;
  component_name: string;
  type: "earning" | "deduction";
  monthly_amount: string;
}

export function SalaryComponentForm() {
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [salary, setSalary] = useState<EmployeeSalary | null>(null);
  const [allocations, setAllocations] = useState<ComponentAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: scData, isLoading: scLoading } = useSalaryComponentsList({ is_active: true, limit: 200 });
  const createMutation = useCreateEmployeeSalary();
  const updateMutation = useUpdateEmployeeSalary();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<SalaryFormValues>({
    resolver: zodResolver(salarySchema),
    defaultValues: {
      employee_id: "",
      annual_ctc: "",
      currency: "INR",
      year: String(new Date().getFullYear()),
      status: "draft",
      effective_from: "",
      effective_to: "",
      remarks: "",
    },
  });

  const watchedEmployeeId = watch("employee_id");
  const watchedAnnualCtc = watch("annual_ctc");

  const { data: salData } = useEmployeeSalariesList(
    watchedEmployeeId ? { employee_id: watchedEmployeeId, limit: 1 } : undefined,
  );

  const masterComponents = scData?.items || [];

  // Resolve allocations with auto-calculated amounts for percentage components
  const resolvedAllocations = useMemo(() => {
    const amounts: Record<number, string> = {};
    const codeToComponentId: Record<string, number> = {};
    for (const c of masterComponents) {
      codeToComponentId[c.code.toLowerCase()] = c.id;
    }
    const allocMap: Record<number, number> = {};
    for (const a of allocations) {
      allocMap[a.component_id] = Number(a.monthly_amount) || 0;
    }
    for (const c of masterComponents) {
      if (c.calculation_type !== "percentage") continue;
      if (!c.percentage_of || !c.percentage_value) continue;
      const baseId = codeToComponentId[c.percentage_of.toLowerCase()];
      if (baseId === undefined) continue;
      const baseAmount = allocMap[baseId] || 0;
      if (baseAmount > 0) {
        amounts[c.id] = ((c.percentage_value / 100) * baseAmount).toFixed(2);
      }
    }
    return allocations.map((a) => {
      const computed = amounts[a.component_id];
      if (computed !== undefined) return { ...a, monthly_amount: computed };
      return a;
    });
  }, [masterComponents, allocations]);

  const loadEmployees = useCallback(async () => {
    try {
      const all: EmployeeListItem[] = [];
      const first = await listEmployeesPaginated({ active: true, per_page: 100 });
      all.push(...first.employees);
      const pages = first.pagination?.total_pages || 1;
      for (let p = 2; p <= pages; p++) {
        const page = await listEmployeesPaginated({ active: true, per_page: 100, page: p });
        all.push(...page.employees);
      }
      setEmployees(all);
    } catch { setError("Failed to load employees."); }
  }, []);

  useEffect(() => { loadEmployees().finally(() => setLoading(false)); }, [loadEmployees]);

  useEffect(() => {
    if (!salData?.items?.length) {
      setSalary(null);
      return;
    }
    const s = salData.items[0];
    setSalary(s);
    reset({
      employee_id: s.employee_id,
      annual_ctc: String(s.annual_ctc),
      currency: s.currency,
      year: String(s.year),
      status: s.status,
      effective_from: s.effective_from,
      effective_to: s.effective_to || "",
      remarks: s.remarks || "",
    });
  }, [salData, reset]);

  const employeeOptions = useMemo(
    () => employees.map((e) => ({ value: e.id, label: `${e.full_name} (${e.employee_number})` })),
    [employees],
  );

  const earningComponents = masterComponents.filter((c: SalaryComponent) => c.type === "earning");
  const deductionComponents = masterComponents.filter((c: SalaryComponent) => c.type === "deduction");

  const toggleAllocation = (component: SalaryComponent) => {
    setAllocations((prev) => {
      const existing = prev.find((a) => a.component_id === component.id);
      if (existing) return prev.filter((a) => a.component_id !== component.id);
      return [...prev, { component_id: component.id, component_name: component.name, type: component.type, monthly_amount: "" }];
    });
  };

  const updateAllocationAmount = (componentId: number, monthly_amount: string) => {
    setAllocations((prev) => prev.map((a) => a.component_id === componentId ? { ...a, monthly_amount } : a));
  };

  const annualCtc = Number(watchedAnnualCtc) || 0;
  const totalMonthly = resolvedAllocations.reduce((sum, a) => sum + (Number(a.monthly_amount) || 0), 0);
  const expectedMonthly = annualCtc / 12;

  const onSubmit = async (data: SalaryFormValues) => {
    setError("");
    setSuccess("");
    try {
      const payload = {
        employee_id: data.employee_id,
        annual_ctc: Number(data.annual_ctc),
        currency: data.currency,
        year: Number(data.year),
        status: data.status,
        effective_from: data.effective_from,
        effective_to: data.effective_to || undefined,
        remarks: data.remarks || undefined,
      };

      let savedSalary: EmployeeSalary;
      if (salary) {
        savedSalary = await updateMutation.mutateAsync({ id: salary.id, payload });
      } else {
        savedSalary = await createMutation.mutateAsync(payload as any);
      }

      // Persist component allocations (using resolved amounts for percentage components)
      if (resolvedAllocations.length > 0) {
        if (salary) {
          const existing = await listEmployeeSalaryComponents({ employee_salary_id: savedSalary.id });
          for (const esc of existing.items) {
            await deleteEmployeeSalaryComponent(esc.id);
          }
        }
        for (const alloc of resolvedAllocations) {
          await createEmployeeSalaryComponent({
            employee_salary_id: savedSalary.id,
            salary_component_id: alloc.component_id,
            monthly_amount: Number(alloc.monthly_amount),
          });
        }
      }

      setSuccess("Salary saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save salary.");
    }
  };

  if (loading || scLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-text-primary uppercase tracking-wider">Employee</legend>
          <Select label="Employee" {...register("employee_id")} error={errors.employee_id?.message} options={employeeOptions} />
        </fieldset>

        {watchedEmployeeId && (
          <>
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-text-primary uppercase tracking-wider">CTC Details</legend>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Input label="Annual CTC" type="number" step="0.01" {...register("annual_ctc")} error={errors.annual_ctc?.message} />
                <Input label="Expected Monthly" value={expectedMonthly ? expectedMonthly.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : ""} disabled />
                <Select label="Currency" {...register("currency")} error={errors.currency?.message} options={[{ value: "INR", label: "INR" }, { value: "USD", label: "USD" }]} />
                <Input label="Year" type="number" {...register("year")} error={errors.year?.message} />
                <Input label="Effective From" type="date" {...register("effective_from")} error={errors.effective_from?.message} />
                <Input label="Effective To" type="date" {...register("effective_to")} error={errors.effective_to?.message} />
                <Select label="Status" {...register("status")} error={errors.status?.message}
                  options={[{ value: "draft", label: "Draft" }, { value: "approved", label: "Approved" }, { value: "paid", label: "Paid" }]} />
                <div className="sm:col-span-2">
                  <Input label="Remarks" {...register("remarks")} error={errors.remarks?.message} />
                </div>
              </div>
            </fieldset>

            {masterComponents.length > 0 && (
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-text-primary uppercase tracking-wider">Component Breakdown</legend>
                <p className="text-xs text-text-muted">Select components from the master list and enter monthly amounts.</p>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-text-primary">Earnings</h3>
                    {earningComponents.map((c: SalaryComponent) => {
                      const alloc = allocations.find((a) => a.component_id === c.id);
                      const resolved = resolvedAllocations.find((a) => a.component_id === c.id);
                      const isPercentage = c.calculation_type === "percentage";
                      return (
                        <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                          <input type="checkbox" checked={!!alloc} onChange={() => toggleAllocation(c)} className="h-4 w-4" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{c.name}</p>
                            <p className="text-xs text-text-muted">
                              {c.code}
                              {isPercentage ? ` (${c.percentage_value}% of ${c.percentage_of})` : ""}
                            </p>
                          </div>
                          {resolved && (
                            <Input
                              name={`amount-${c.id}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={resolved.monthly_amount}
                              onChange={(e) => {
                                if (!isPercentage) updateAllocationAmount(c.id, e.target.value);
                              }}
                              disabled={isPercentage}
                              placeholder="Amount"
                              className="w-32"
                            />
                          )}
                        </div>
                      );
                    })}
                    {earningComponents.length === 0 && <p className="text-sm text-text-muted">No earning components defined.</p>}
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-text-primary">Deductions</h3>
                    {deductionComponents.map((c: SalaryComponent) => {
                      const alloc = allocations.find((a) => a.component_id === c.id);
                      const resolved = resolvedAllocations.find((a) => a.component_id === c.id);
                      const isPercentage = c.calculation_type === "percentage";
                      return (
                        <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                          <input type="checkbox" checked={!!alloc} onChange={() => toggleAllocation(c)} className="h-4 w-4" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{c.name}</p>
                            <p className="text-xs text-text-muted">
                              {c.code}
                              {isPercentage ? ` (${c.percentage_value}% of ${c.percentage_of})` : ""}
                            </p>
                          </div>
                          {resolved && (
                            <Input
                              name={`amount-${c.id}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={resolved.monthly_amount}
                              onChange={(e) => {
                                if (!isPercentage) updateAllocationAmount(c.id, e.target.value);
                              }}
                              disabled={isPercentage}
                              placeholder="Amount"
                              className="w-32"
                            />
                          )}
                        </div>
                      );
                    })}
                    {deductionComponents.length === 0 && <p className="text-sm text-text-muted">No deduction components defined.</p>}
                  </div>
                </div>
              </fieldset>
            )}

            <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
              <div className="text-sm">
                <span className="text-text-secondary">Annual CTC: </span>
                <span className="font-semibold text-text-primary">{annualCtc.toLocaleString("en-IN")}</span>
              </div>
              <div className="text-sm">
                <span className="text-text-secondary">Total Monthly: </span>
                <span className="font-semibold text-text-primary">{totalMonthly.toLocaleString("en-IN")}</span>
                {totalMonthly > 0 && (
                  <span className={`ml-2 text-xs ${Math.abs(totalMonthly - expectedMonthly) < 1 ? "text-green-600" : "text-amber-600"}`}>
                    (expected: {expectedMonthly.toLocaleString("en-IN", { minimumFractionDigits: 2 })})
                  </span>
                )}
              </div>
            </div>

            <Button type="submit" size="lg" loading={createMutation.isPending || updateMutation.isPending}>
              {salary ? "Update Salary" : "Save Salary"}
            </Button>
          </>
        )}
      </form>
    </div>
  );
}
