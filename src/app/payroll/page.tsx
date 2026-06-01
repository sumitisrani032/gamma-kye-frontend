"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { Button, Alert, Card, CardContent, CardHeader, Input, Select } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import { Can } from "@/components/common/can";
import { SalaryComponentsMaster } from "@/features/payroll/components/salary-components-master";
import {
  useEmployeeSalariesList,
  useDeleteEmployeePayslip,
  useEmployeePayslipsList,
  useUpdateEmployeePayslip,
  useSalaryComponentsList,
  useCreateEmployeeSalary,
  useUpdateEmployeeSalary,
} from "@/features/payroll/hooks";
import { useAuth } from "@/contexts/auth-context";
import {
  createEmployeePayslip,
  listEmployeePayslips,
  listEmployeeSalaryComponents,
  listEmployeeSalaries,
  createEmployeeSalaryComponent,
  deleteEmployeeSalaryComponent,
} from "@/services/payroll-service";
import { listEmployeesPaginated } from "@/services/employee-service";
import type {
  EmployeeListItem,
  EmployeePayslip,
  EmployeePayslipData,
  EmployeeSalary,
  EmployeeSalaryComponent,
  EmployeeSalaryData,
  SalaryComponent,
} from "@/types";

type Tab = "structure" | "salary" | "breakdown" | "payslips";

function useVisibleTabs() {
  const { can, canWithScope } = useAuth();
  const all = [
    { key: "structure" as Tab, label: "Structure", show: () => can("payroll", "process") || canWithScope("payroll", "read", "global") },
    { key: "salary" as Tab, label: "CTC Setup", show: () => can("payroll", "process") },
    { key: "breakdown" as Tab, label: "Breakdown", show: () => can("payroll", "process") },
    { key: "payslips" as Tab, label: "Payslips", show: () => can("payroll", "process") || canWithScope("payroll", "read", "self") },
  ];
  return all.filter((t) => t.show());
}

const MONTHS_SHORT = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = [
  { value: "1", label: "January" }, { value: "2", label: "February" }, { value: "3", label: "March" },
  { value: "4", label: "April" }, { value: "5", label: "May" }, { value: "6", label: "June" },
  { value: "7", label: "July" }, { value: "8", label: "August" }, { value: "9", label: "September" },
  { value: "10", label: "October" }, { value: "11", label: "November" }, { value: "12", label: "December" },
];

function previousPeriod(month: number, year: number) {
  return month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year };
}

function componentCodeFromName(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    approved: "bg-green-100 text-green-700",
    paid: "bg-blue-100 text-blue-700",
  };
  return `inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${map[status] || map.draft}`;
}

export default function PayrollPage() {
  const tabs = useVisibleTabs();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(tabs[0]?.key || "payslips");

  useEffect(() => {
    const tabParam = searchParams.get("tab") as Tab | null;
    if (tabParam && tabs.some((t) => t.key === tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  return (
    <>
      <TopBar title="Payroll" description="Manage salary components, CTC, and payslips" />
      <div className="px-8 py-6 space-y-6">
        <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-primary-600 text-white"
                  : "text-text-secondary hover:bg-surface-tertiary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "structure" && <StructurePanel />}
        {activeTab === "salary" && <SalarySetupPanel />}
        {activeTab === "breakdown" && <BreakdownPanel />}
        {activeTab === "payslips" && <CombinedPayslipsPanel />}
      </div>
    </>
  );
}

/* ─── CTC List ─── */

function CtcListPanel() {
  const { data, isLoading } = useEmployeeSalariesList({ limit: 100 });
  const salaries = data?.items || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface-secondary">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Employee</th>
            <th className="px-4 py-3 text-right font-medium text-text-secondary">Annual CTC</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Currency</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Year</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">From</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">To</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {salaries.map((s: EmployeeSalary) => (
            <tr key={s.id} className="hover:bg-surface-secondary/50">
              <td className="px-4 py-3 text-text-primary">{s.employee_name || s.employee_id.slice(0, 8)}</td>
              <td className="px-4 py-3 text-right font-medium text-text-primary">{s.annual_ctc.toLocaleString("en-IN")}</td>
              <td className="px-4 py-3 text-text-primary">{s.currency}</td>
              <td className="px-4 py-3 text-text-primary">{s.year}</td>
              <td className="px-4 py-3 text-text-secondary">{s.effective_from}</td>
              <td className="px-4 py-3 text-text-secondary">{s.effective_to || "—"}</td>
              <td className="px-4 py-3">
                <span className={statusBadge(s.status)}>{s.status}</span>
              </td>
            </tr>
          ))}
          {salaries.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted">No salary assignments yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Structure (Components + CTC List) ─── */

function StructurePanel() {
  return (
    <div className="space-y-8">
      <Can resource="payroll" action="process">
        <Card>
          <CardHeader>Components</CardHeader>
          <CardContent>
            <SalaryComponentsMaster />
          </CardContent>
        </Card>
      </Can>
    </div>
  );
}

/* ─── CTC Setup ─── */

function SalarySetupPanel() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [salary, setSalary] = useState<EmployeeSalary | null>(null);
  const [annualCtc, setAnnualCtc] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<"draft" | "approved" | "paid">("draft");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const createSalaryMutation = useCreateEmployeeSalary();
  const updateSalaryMutation = useUpdateEmployeeSalary();

  const loadEmployees = useCallback(async () => {
    setEmployeesLoading(true);
    try {
      const first = await listEmployeesPaginated({ active: true, per_page: 100 });
      const all = [...first.employees];
      const pages = first.pagination?.total_pages || 1;
      for (let p = 2; p <= pages; p++) {
        const page = await listEmployeesPaginated({ active: true, per_page: 100, page: p });
        all.push(...page.employees);
      }
      setEmployees(all);
    } catch {
      setError("Failed to load employees.");
    }
    setEmployeesLoading(false);
  }, []);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);

  useEffect(() => {
    if (!selectedEmployeeId) {
      setSalary(null);
      setAnnualCtc("");
      setCurrency("INR");
      setYear(String(new Date().getFullYear()));
      setEffectiveFrom(new Date().toISOString().slice(0, 10));
      setStatus("draft");
      setRemarks("");
      return;
    }
    (async () => {
      setError("");
      try {
        const data = await listEmployeeSalaries({ employee_id: selectedEmployeeId, limit: 1 });
        const found = data.items?.[0];
        setSalary(found || null);
        setAnnualCtc(found ? String(found.annual_ctc) : "");
        setCurrency(found?.currency || "INR");
        setYear(found ? String(found.year) : String(new Date().getFullYear()));
        setEffectiveFrom(found?.effective_from || new Date().toISOString().slice(0, 10));
        setStatus(found?.status || "draft");
        setRemarks(found?.remarks || "");
      } catch {
        setError("Failed to load salary record.");
      }
    })();
  }, [selectedEmployeeId]);

  const employeeOptions = useMemo(
    () => employees.map((e) => ({ value: e.id, label: `${e.full_name} (${e.employee_number})` })),
    [employees],
  );

  const handleSave = async () => {
    setError("");
    setSuccess("");
    if (!selectedEmployeeId) {
      setError("Select an employee.");
      return;
    }
    if (!annualCtc || Number(annualCtc) <= 0) {
      setError("Enter a valid annual CTC.");
      return;
    }

    const payload: EmployeeSalaryData = {
      employee_id: selectedEmployeeId,
      annual_ctc: Number(annualCtc),
      currency,
      year: Number(year),
      status,
      effective_from: effectiveFrom,
      remarks: remarks || undefined,
    };

    try {
      const saved = salary
        ? await updateSalaryMutation.mutateAsync({ id: salary.id, payload })
        : await createSalaryMutation.mutateAsync(payload);
      setSalary(saved);
      setSuccess(salary ? "Salary record updated." : "Salary record created.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save salary record.");
    }
  };

  const expectedMonthly = (Number(annualCtc) || 0) / 12;

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card>
        <CardHeader>CTC List</CardHeader>
        <CardContent className="p-0">
          <CtcListPanel />
        </CardContent>
      </Card>

      <Can resource="payroll" action="process">
        <Card>
          <CardHeader>{salary ? "Edit Employee CTC" : "Create Employee CTC"}</CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select
                label="Employee"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                options={[{ value: "", label: "Select an employee..." }, ...employeeOptions]}
                disabled={employeesLoading}
              />
              {selectedEmployeeId && (
                <>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Input label="Annual CTC" type="number" min="0" step="0.01" value={annualCtc} onChange={(e) => setAnnualCtc(e.target.value)} />
                    <Input
                      label="Monthly CTC"
                      value={expectedMonthly ? expectedMonthly.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : ""}
                      disabled
                    />
                    <Select
                      label="Currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      options={[{ value: "INR", label: "INR" }, { value: "USD", label: "USD" }]}
                    />
                    <Input label="Year" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
                    <Input label="Effective From" type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
                    <Select
                      label="Status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as "draft" | "approved" | "paid")}
                      options={[{ value: "draft", label: "Draft" }, { value: "approved", label: "Approved" }, { value: "paid", label: "Paid" }]}
                    />
                    <div className="md:col-span-3">
                      <Input label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSave} loading={createSalaryMutation.isPending || updateSalaryMutation.isPending}>
                      {salary ? "Update CTC" : "Create CTC"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </Can>
    </div>
  );
}

/* ─── Component Table Row ─── */

interface ComponentRowAlloc {
  row_id: string;
  component_id: number | null;
  component_code: string;
  component_name: string;
  type: "earning" | "deduction";
  calculation_type: "fixed" | "percentage";
  percentage_value: string;
  percentage_of: string;
  monthly_amount: string;
}

function ComponentTableRow({
  alloc,
  componentOptions,
  disabled,
  onUpdate,
  onUpdateAmount,
  onRemove,
  resolvedAmount,
}: {
  alloc: ComponentRowAlloc;
  componentOptions: { value: string; label: string }[];
  disabled?: boolean;
  onUpdate: (patch: Partial<ComponentRowAlloc>) => void;
  onUpdateAmount: (amount: string) => void;
  onRemove: () => void;
  resolvedAmount: string;
}) {
  const isPercentage = alloc.calculation_type === "percentage";
  const isCustom = alloc.component_id === null;

  return (
    <tr className="hover:bg-surface-secondary/50 transition-colors">
      <td className="px-4 py-3 min-w-64 text-text-primary font-medium">
        {isCustom ? (
          <Input
            value={alloc.component_name}
            onChange={(e) => {
              const name = e.target.value;
              onUpdate({ component_name: name, component_code: componentCodeFromName(name) });
            }}
            placeholder="Component name"
            aria-label="Custom component name"
            disabled={disabled}
          />
        ) : (
          alloc.component_name
        )}
      </td>
      <td className="px-4 py-3 min-w-36">
        <Select
          value={alloc.type}
          onChange={(e) => onUpdate({ type: e.target.value as "earning" | "deduction" })}
          options={[{ value: "earning", label: "Earning" }, { value: "deduction", label: "Deduction" }]}
          aria-label={`${alloc.component_name} component type`}
          disabled={disabled || !isCustom}
        />
      </td>
      <td className="px-4 py-3 min-w-40">
        <Select
          value={alloc.calculation_type}
          onChange={(e) => onUpdate({ calculation_type: e.target.value as "fixed" | "percentage" })}
          options={[{ value: "fixed", label: "Fixed" }, { value: "percentage", label: "% based" }]}
          aria-label={`${alloc.component_name} calculation type`}
          disabled={disabled}
        />
      </td>
      <td className="px-4 py-3 min-w-32">
        {isPercentage ? (
          <Input
            type="number"
            min="0"
            step="0.01"
            value={alloc.percentage_value}
            onChange={(e) => onUpdate({ percentage_value: e.target.value })}
            aria-label={`${alloc.component_name} percentage`}
            disabled={disabled}
          />
        ) : (
          <span className="text-text-muted">—</span>
        )}
      </td>
      <td className="px-4 py-3 min-w-56">
        {isPercentage ? (
          <Select
            value={alloc.percentage_of}
            onChange={(e) => onUpdate({ percentage_of: e.target.value })}
            options={[{ value: "", label: "Select component..." }, ...componentOptions]}
            aria-label={`${alloc.component_name} percentage base component`}
            disabled={disabled}
          />
        ) : (
          <span className="text-text-muted">—</span>
        )}
      </td>
      <td className="px-4 py-3 min-w-40 text-right">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={isPercentage ? resolvedAmount : alloc.monthly_amount}
          onChange={(e) => onUpdateAmount(e.target.value)}
          disabled={isPercentage || disabled}
          aria-label={`${alloc.component_name} monthly amount`}
          className="text-right"
        />
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={onRemove}
          disabled={disabled}
          className="rounded-lg bg-danger px-2.5 py-1 text-xs font-medium text-white hover:opacity-90 transition-opacity"
        >
          Remove
        </button>
      </td>
    </tr>
  );
}

/* ─── Component Breakdown ─── */

function BreakdownPanel() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);

  const [salary, setSalary] = useState<EmployeeSalary | null>(null);

  const [allocations, setAllocations] = useState<ComponentRowAlloc[]>([]);
  const [allocationsDirty, setAllocationsDirty] = useState(false);
  const [allocSaving, setAllocSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sourcePeriod, setSourcePeriod] = useState("");


  const { data: scData, isLoading: scLoading } = useSalaryComponentsList({ is_active: true, limit: 200 });
  const masterComponents = useMemo(() => scData?.items || [], [scData?.items]);

  const loadEmployees = useCallback(async () => {
    setEmployeesLoading(true);
    try {
      const first = await listEmployeesPaginated({ active: true, per_page: 100 });
      const all = [...first.employees];
      const pages = first.pagination?.total_pages || 1;
      for (let p = 2; p <= pages; p++) {
        const page = await listEmployeesPaginated({ active: true, per_page: 100, page: p });
        all.push(...page.employees);
      }
      setEmployees(all);
    } catch {
      setError("Failed to load employees.");
    }
    setEmployeesLoading(false);
  }, []);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);

  const mapComponentAllocations = useCallback((items: EmployeeSalaryComponent[]): ComponentRowAlloc[] => (
    items.map((item) => {
      const mc = masterComponents.find((c: SalaryComponent) => c.id === item.salary_component_id);
      return {
        row_id: `master-${item.salary_component_id}`,
        component_id: item.salary_component_id,
        component_code: mc?.code || `component_${item.salary_component_id}`,
        component_name: mc?.name || `#${item.salary_component_id}`,
        type: mc?.type || "earning",
        calculation_type: mc?.calculation_type || "fixed",
        percentage_value: mc?.percentage_value ? String(mc.percentage_value) : "",
        percentage_of: mc?.percentage_of || "",
        monthly_amount: String(item.monthly_amount),
      };
    })
  ), [masterComponents]);

  const mapPayslipSnapshot = useCallback((payslip: EmployeePayslip): ComponentRowAlloc[] => {
    const snapshot = payslip.component_snapshot as {
      earnings?: Record<string, number | string>;
      deductions?: Record<string, number | string>;
    };
    const rows: ComponentRowAlloc[] = [];

    for (const [group, values] of Object.entries({
      earning: snapshot.earnings || {},
      deduction: snapshot.deductions || {},
    }) as Array<["earning" | "deduction", Record<string, number | string>]>) {
      for (const [code, amount] of Object.entries(values)) {
        const mc = masterComponents.find((component) => component.code.toLowerCase() === code.toLowerCase());
        rows.push({
          row_id: mc ? `master-${mc.id}` : `custom-${code}`,
          component_id: mc?.id || null,
          component_code: mc?.code || componentCodeFromName(code) || code,
          component_name: mc?.name || code,
          type: mc?.type || group,
          calculation_type: mc?.calculation_type || "fixed",
          percentage_value: mc?.percentage_value ? String(mc.percentage_value) : "",
          percentage_of: mc?.percentage_of || "",
          monthly_amount: String(amount),
        });
      }
    }

    return rows;
  }, [masterComponents]);

  const defaultAllocations = useCallback((): ComponentRowAlloc[] => (
    masterComponents.map((component: SalaryComponent) => ({
      row_id: `master-${component.id}`,
      component_id: component.id,
      component_code: component.code,
      component_name: component.name,
      type: component.type,
      calculation_type: component.calculation_type,
      percentage_value: component.percentage_value ? String(component.percentage_value) : "",
      percentage_of: component.percentage_of || "",
      monthly_amount: "",
    }))
  ), [masterComponents]);

  // Load salary + allocations when employee or period changes.
  useEffect(() => {
    if (!selectedEmployeeId) {
      setSalary(null);
      setAllocations([]);
      setSourcePeriod("");
      return;
    }
    (async () => {
      setError("");
      setSuccess("");
      const salData = await listEmployeeSalaries({ employee_id: selectedEmployeeId, limit: 1 });
      const found: EmployeeSalary | undefined = salData?.items?.[0];
      if (found) {
        setSalary(found);
        try {
          const selectedMonth = Number(month);
          const selectedYear = Number(year);
          const selectedPayslipRes = await listEmployeePayslips({
            employee_id: selectedEmployeeId,
            month: selectedMonth,
            year: selectedYear,
            limit: 1,
          });
          const selectedPayslip = selectedPayslipRes.items[0];
          if (selectedPayslip) {
            setAllocations(mapPayslipSnapshot(selectedPayslip));
            setAllocationsDirty(false);
            setSourcePeriod(`Generated payslip: ${MONTHS_FULL[selectedMonth - 1]?.label} ${selectedYear}`);
            return;
          }
          const prev = previousPeriod(selectedMonth, selectedYear);
          const payslipRes = await listEmployeePayslips({
            employee_id: selectedEmployeeId,
            month: prev.month,
            year: prev.year,
            limit: 1,
          });
          const previousPayslip = payslipRes.items[0];
          if (previousPayslip) {
            const payslipAllocations = mapPayslipSnapshot(previousPayslip);
            if (payslipAllocations.length > 0) {
              setAllocations(payslipAllocations);
              setAllocationsDirty(true);
              setSourcePeriod(`Payslip: ${MONTHS_FULL[prev.month - 1]?.label} ${prev.year}`);
              return;
            }
          }

          const currentSetup = await listEmployeeSalaryComponents({ employee_salary_id: found.id });
          if (currentSetup.items.length > 0) {
            setAllocations(mapComponentAllocations(currentSetup.items));
            setAllocationsDirty(false);
            setSourcePeriod("Current setup");
            return;
          }

          const defaults = defaultAllocations();
          setAllocations(defaults);
          setAllocationsDirty(defaults.length > 0);
          setSourcePeriod(defaults.length > 0 ? "Default components" : "");
        } catch {
          setAllocations([]);
          setSourcePeriod("");
        }
      } else {
        setSalary(null);
        const defaults = defaultAllocations();
        setAllocations(defaults);
        setAllocationsDirty(false);
        setSourcePeriod(defaults.length > 0 ? "Default components" : "");
      }
    })();
  }, [selectedEmployeeId, month, year, mapComponentAllocations, mapPayslipSnapshot, defaultAllocations]);

  const employeeOptions = useMemo(
    () => employees.map((e) => ({ value: e.id, label: `${e.full_name} (${e.employee_number})` })),
    [employees],
  );

  const earningComponents = masterComponents.filter((c: SalaryComponent) => c.type === "earning");
  const deductionComponents = masterComponents.filter((c: SalaryComponent) => c.type === "deduction");

  const availableToAdd = masterComponents.filter(
    (mc) => !allocations.some((a) => a.component_id === mc.id),
  );

  const calculationBaseOptions = allocations
    .filter((allocation) => allocation.component_code)
    .map((allocation) => ({
      value: allocation.component_code,
      label: `${allocation.component_name} (${allocation.component_code})`,
    }));

  // Resolve amounts for percentage components
  const resolvedAllocations = useMemo(() => {
    const amounts: Record<number, string> = {};
    const codeToRowId: Record<string, string> = {};
    for (const allocation of allocations) {
      if (allocation.component_code) codeToRowId[allocation.component_code.toLowerCase()] = allocation.row_id;
    }

    const allocMap: Record<string, number> = {};
    for (const a of allocations) allocMap[a.row_id] = Number(a.monthly_amount) || 0;

    for (const a of allocations) {
      if (a.calculation_type !== "percentage") continue;
      if (!a.percentage_of || !a.percentage_value) continue;
      const baseRowId = codeToRowId[a.percentage_of.toLowerCase()];
      if (baseRowId === undefined) continue;
      const baseAmount = allocMap[baseRowId] || 0;
      if (baseAmount > 0) {
        amounts[a.row_id] = ((Number(a.percentage_value) / 100) * baseAmount).toFixed(2);
      }
    }
    return allocations.map((a) => {
      if (amounts[a.row_id] !== undefined) return { ...a, monthly_amount: amounts[a.row_id] };
      return a;
    });
  }, [masterComponents, allocations]);

  const addComponent = (component: SalaryComponent) => {
    setAllocations((prev) => {
      if (prev.some((a) => a.component_id === component.id)) return prev;
      return [...prev, {
        row_id: `master-${component.id}`,
        component_id: component.id,
        component_code: component.code,
        component_name: component.name,
        type: component.type,
        calculation_type: component.calculation_type,
        percentage_value: component.percentage_value ? String(component.percentage_value) : "",
        percentage_of: component.percentage_of || "",
        monthly_amount: "",
      }];
    });
    setAllocationsDirty(true);
  };

  const addCustomComponent = () => {
    const rowId = `custom-${Date.now()}`;
    setAllocations((prev) => [
      ...prev,
      {
        row_id: rowId,
        component_id: null,
        component_code: rowId,
        component_name: "",
        type: "earning",
        calculation_type: "fixed",
        percentage_value: "",
        percentage_of: "",
        monthly_amount: "",
      },
    ]);
    setAllocationsDirty(true);
  };

  const updateAllocation = (rowId: string, patch: Partial<ComponentRowAlloc>) => {
    setAllocations((prev) => prev.map((a) => a.row_id === rowId ? { ...a, ...patch } : a));
    setAllocationsDirty(true);
  };

  const updateAmount = (rowId: string, amount: string) => {
    setAllocations((prev) => prev.map((a) => a.row_id === rowId ? { ...a, monthly_amount: amount } : a));
    setAllocationsDirty(true);
  };

  const removeComponent = (rowId: string) => {
    setAllocations((prev) => prev.filter((a) => a.row_id !== rowId));
    setAllocationsDirty(true);
  };

  // Compute totals for display
  const totalMonthly = resolvedAllocations.reduce((sum, a) => sum + (Number(a.monthly_amount) || 0), 0);
  const annualCtc = salary ? salary.annual_ctc : 0;
  const expectedMonthly = annualCtc / 12;

  const saveAllocations = async (): Promise<boolean> => {
    if (!salary) {
      setError("Create the employee CTC record before assigning monthly components.");
      return false;
    }

    // Persist component allocations
    setAllocSaving(true);
    try {
      const existing = await listEmployeeSalaryComponents({ employee_salary_id: salary.id });
      for (const esc of existing.items) {
        await deleteEmployeeSalaryComponent(esc.id);
      }
      for (const alloc of resolvedAllocations) {
        if (alloc.component_id !== null && (Number(alloc.monthly_amount) > 0 || alloc.monthly_amount !== "")) {
          await createEmployeeSalaryComponent({
            employee_salary_id: salary.id,
            salary_component_id: alloc.component_id,
            monthly_amount: Number(alloc.monthly_amount) || 0,
          });
        }
      }
    } catch {
      setError("Failed to save component allocations.");
      setAllocSaving(false);
      return false;
    }
    setAllocSaving(false);
    setAllocationsDirty(false);
    setSourcePeriod("Current setup");
    setSuccess("Monthly component breakdown saved.");
    return true;
  };

  const handleGeneratePayslip = async () => {
    setError("");
    setSuccess("");

    if (!salary) {
      setError("Create the employee CTC record before generating a payslip.");
      return;
    }
    if (resolvedAllocations.length === 0) {
      setError("Assign at least one component before generating a payslip.");
      return;
    }
    if (allocationsDirty) {
      const saved = await saveAllocations();
      if (!saved) return;
    }

    setGenerating(true);
    try {
      const earnings: Record<string, number> = {};
      const deductions: Record<string, number> = {};
      let gross = 0;
      let deductionTotal = 0;

      for (const allocation of resolvedAllocations) {
        const snapshotKey = allocation.component_name.trim() || allocation.component_code || "custom_component";
        const amount = Number(allocation.monthly_amount) || 0;
        if (allocation.type === "earning") {
          earnings[snapshotKey] = amount;
          gross += amount;
        } else {
          deductions[snapshotKey] = amount;
          deductionTotal += amount;
        }
      }

      await createEmployeePayslip({
        employee_id: salary.employee_id,
        employee_salary_id: salary.id,
        month: Number(month),
        year: Number(year),
        component_snapshot: { earnings, deductions },
        gross_amount: gross,
        deduction_amount: deductionTotal,
        net_amount: gross - deductionTotal,
        generated_on: new Date().toISOString().slice(0, 10),
        status: "draft",
        total_attendance: 30,
        paid_days: 30,
        lop_days: 0,
      });
      setAllocationsDirty(false);
      setSourcePeriod(`Generated payslip: ${MONTHS_FULL[Number(month) - 1]?.label} ${year}`);
      setSuccess("Payslip generated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate payslip.");
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card>
        <CardHeader>Employee & Period</CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Select
              label="Employee"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              options={[{ value: "", label: "Select an employee..." }, ...employeeOptions]}
              disabled={employeesLoading}
            />
            <Select
              label="Month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              options={MONTHS_FULL}
            />
            <Input
              label="Year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Salary Info */}
      {selectedEmployeeId && (
        <Card>
          <CardHeader>CTC Details</CardHeader>
          <CardContent>
            {salary ? (
              <div className="flex items-center justify-between">
                <div className="flex gap-8 text-sm">
                  <div>
                    <span className="text-text-secondary">Annual CTC: </span>
                    <span className="font-semibold text-text-primary">{salary.annual_ctc.toLocaleString("en-IN")}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Currency: </span>
                    <span className="text-text-primary">{salary.currency}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Effective: </span>
                    <span className="text-text-primary">{salary.effective_from}</span>
                  </div>
                </div>
              </div>
            ) : (
              <Alert variant="warning">No CTC record found for this employee. Create it in CTC Setup before assigning components.</Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Component Table */}
      {selectedEmployeeId && scLoading && (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      )}
      {selectedEmployeeId && !scLoading && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <span>Component Breakdown</span>
              <span className="text-sm font-normal text-text-secondary">
                {sourcePeriod ? `Source: ${sourcePeriod}` : `${allocations.length} component${allocations.length !== 1 ? "s" : ""} assigned`}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-secondary">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-text-secondary">Component</th>
                    <th className="px-4 py-3 text-left font-medium text-text-secondary">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-text-secondary">Calculation Type</th>
                    <th className="px-4 py-3 text-left font-medium text-text-secondary">Percentage</th>
                    <th className="px-4 py-3 text-left font-medium text-text-secondary">Of Component</th>
                    <th className="px-4 py-3 text-right font-medium text-text-secondary">Amount</th>
                    <th className="px-4 py-3 text-right font-medium text-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allocations.map((alloc) => {
                    const resolved = resolvedAllocations.find((r) => r.row_id === alloc.row_id);
                    return (
                      <ComponentTableRow
                        key={alloc.row_id}
                        alloc={alloc}
                        componentOptions={calculationBaseOptions.filter((option) => option.value !== alloc.component_code)}
                        onUpdate={(patch) => updateAllocation(alloc.row_id, patch)}
                        onUpdateAmount={(amt) => updateAmount(alloc.row_id, amt)}
                        onRemove={() => removeComponent(alloc.row_id)}
                        resolvedAmount={resolved?.monthly_amount || alloc.monthly_amount}
                      />
                    );
                  })}
                  {allocations.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted">No components assigned yet.</td></tr>
                  )}
                  <tr className="bg-surface-secondary font-semibold">
                    <td className="px-4 py-3 text-text-primary" colSpan={5}>Master Sum Per Month</td>
                    <td className="px-4 py-3 text-right text-text-primary">
                      {totalMonthly.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-normal text-text-secondary">
                      Expected {expectedMonthly.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totals bar */}
            <div className="flex items-center justify-between border-t border-border bg-surface px-4 py-3">
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

            {/* Add Component + Generate */}
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-text-secondary">Add component:</span>
                <select
                  value=""
                  onChange={(e) => {
                    const comp = masterComponents.find((c) => c.id === Number(e.target.value));
                    if (comp) addComponent(comp);
                    e.target.value = "";
                  }}

                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select...</option>
                  <optgroup label="Earnings">
                    {earningComponents.filter((c) => availableToAdd.some((a) => a.id === c.id)).map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </optgroup>
                  <optgroup label="Deductions">
                    {deductionComponents.filter((c) => availableToAdd.some((a) => a.id === c.id)).map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </optgroup>
                </select>
                <button
                  type="button"
                  onClick={addCustomComponent}

                  className="rounded-lg bg-surface-secondary px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-surface-tertiary disabled:opacity-50"
                >
                  Custom Component
                </button>
              </div>

              <Can resource="payroll" action="process">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={saveAllocations}
                    loading={allocSaving}
                    disabled={!salary || (!allocationsDirty && allocations.length > 0)}
                    variant="secondary"
                    size="lg"
                  >
                    Save Breakdown
                  </Button>
                  <Button
                    onClick={handleGeneratePayslip}
                    loading={generating || allocSaving}
                    disabled={!salary || allocations.length === 0}
                    size="lg"
                  >
                    Generate Payslip
                  </Button>
                </div>
              </Can>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ─── Combined Payslips (Approvals + My Payslips) ─── */

function CombinedPayslipsPanel() {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { data: pendingData, isLoading: pendingLoading } = useEmployeePayslipsList({ limit: 100 });
  const { data: allData, isLoading: allLoading } = useEmployeePayslipsList({ limit: 200 });
  const updateMutation = useUpdateEmployeePayslip();
  const deleteMutation = useDeleteEmployeePayslip();
  const pending = (pendingData?.items || []).filter((p: EmployeePayslip) => p.status === "draft");
  const all = allData?.items || [];
  const payslips = search
    ? all.filter((p) => (p.employee_name || "").toLowerCase().includes(search.toLowerCase()))
    : all;

  const handleApprove = async (id: number) => {
    try {
      await updateMutation.mutateAsync({ id, payload: { status: "approved" } as Partial<EmployeePayslipData> });
    } catch { /* ignore */ }
  };

  const handleMarkPaid = async (id: number) => {
    try {
      await updateMutation.mutateAsync({ id, payload: { status: "paid" } as Partial<EmployeePayslipData> });
    } catch { /* ignore */ }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
    } catch { /* ignore */ }
    setDeleteId(null);
  };

  if (pendingLoading || allLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Can resource="payroll" action="process">
        <Card>
          <CardHeader>Pending Approvals</CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-secondary">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-text-secondary">Employee</th>
                    <th className="px-4 py-3 text-left font-medium text-text-secondary">Month</th>
                    <th className="px-4 py-3 text-right font-medium text-text-secondary">Gross</th>
                    <th className="px-4 py-3 text-right font-medium text-text-secondary">Deductions</th>
                    <th className="px-4 py-3 text-right font-medium text-text-secondary">Net</th>
                    <th className="px-4 py-3 text-right font-medium text-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pending.map((p: EmployeePayslip) => (
                    <tr key={p.id} className="hover:bg-surface-secondary/50">
                      <td className="px-4 py-3 text-text-primary">{p.employee_name || p.employee_id.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-text-primary">{MONTHS_SHORT[p.month]} {p.year}</td>
                      <td className="px-4 py-3 text-right text-text-primary">{p.gross_amount.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right text-red-600">{p.deduction_amount.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right font-semibold text-text-primary">{p.net_amount.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleApprove(p.id)}
                          disabled={updateMutation.isPending}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleMarkPaid(p.id)}
                          disabled={updateMutation.isPending}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          Mark Paid
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pending.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">No pending payslips.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </Can>

      <Card>
        <CardHeader>All Payslips</CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <input
              type="text"
              placeholder="Search by employee name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-secondary">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Employee</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Month</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">Gross</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">Deductions</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">Net</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Generated</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payslips.map((p: EmployeePayslip) => (
                  <tr key={p.id} className="hover:bg-surface-secondary/50">
                    <td className="px-4 py-3 text-text-primary">{p.employee_name || p.employee_id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-text-primary">{MONTHS_SHORT[p.month]} {p.year}</td>
                    <td className="px-4 py-3 text-right font-medium text-text-primary">{p.gross_amount.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-right text-red-600">{p.deduction_amount.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-right font-semibold text-text-primary">{p.net_amount.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3"><span className={statusBadge(p.status)}>{p.status}</span></td>
                    <td className="px-4 py-3 text-text-secondary">{new Date(p.generated_on).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link
                        href={`/payroll/payslips/${p.id}`}
                        className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 transition-colors"
                      >
                        View
                      </Link>
                      <Can resource="payroll" action="process">
                        <button
                          onClick={() => setDeleteId(p.id)}
                          className="rounded-lg bg-danger px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity"
                        >
                          Delete
                        </button>
                      </Can>
                    </td>
                  </tr>
                ))}
                {payslips.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-text-muted">No payslips found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <Modal
            open={deleteId !== null}
            onClose={() => setDeleteId(null)}
            onConfirm={handleDelete}
            title="Delete Payslip"
            confirmLabel="Delete"
            loading={deleteMutation.isPending}
          >
            Are you sure you want to delete this payslip? This action cannot be undone.
          </Modal>
        </CardContent>
      </Card>
    </div>
  );
}
