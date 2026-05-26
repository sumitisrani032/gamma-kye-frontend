"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Can } from "@/components/common/can";
import { Alert, Button, Input, Modal, Select } from "@/components/ui";
import {
  useCreateSalaryComponent,
  useDeleteSalaryComponent,
  useSalaryComponentsList,
  useUpdateSalaryComponent,
} from "@/features/payroll/hooks";
import type { SalaryComponent, SalaryComponentData } from "@/types";

const componentSchema = z.object({
  code: z.string().trim().min(1, "Code is required.").max(20, "Code must be under 20 characters."),
  name: z.string().trim().min(1, "Name is required.").max(100, "Name must be under 100 characters."),
  description: z.string().trim().max(500, "Description must be under 500 characters.").optional().or(z.literal("")),
  type: z.enum(["earning", "deduction"]),
  calculation_type: z.enum(["fixed", "percentage"]),
  percentage_value: z.string().trim().optional().or(z.literal("")),
  percentage_of: z.string().trim().optional().or(z.literal("")),
  is_active: z.boolean(),
}).superRefine((data, ctx) => {
  if (data.calculation_type === "percentage") {
    if (!data.percentage_value || isNaN(Number(data.percentage_value)) || Number(data.percentage_value) <= 0) {
      ctx.addIssue({ code: "custom", path: ["percentage_value"], message: "Percentage value is required." });
    }
    if (!data.percentage_of) {
      ctx.addIssue({ code: "custom", path: ["percentage_of"], message: "This field is required." });
    }
  }
});

type ComponentFormValues = z.infer<typeof componentSchema>;

const EMPTY_FORM: ComponentFormValues = {
  code: "",
  name: "",
  description: "",
  type: "earning",
  calculation_type: "fixed",
  percentage_value: "",
  percentage_of: "",
  is_active: true,
};

export function SalaryComponentsMaster() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const { data, isLoading } = useSalaryComponentsList({ limit: 200 });
  const createMutation = useCreateSalaryComponent();
  const updateMutation = useUpdateSalaryComponent();
  const deleteMutation = useDeleteSalaryComponent();
  const components = data?.items || [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ComponentFormValues>({
    resolver: zodResolver(componentSchema),
    defaultValues: EMPTY_FORM,
  });

  const watchedCalcType = watch("calculation_type");

  useEffect(() => {
    if (watchedCalcType === "fixed") {
      reset((prev) => ({ ...prev, percentage_value: "", percentage_of: "" }));
    }
  }, [watchedCalcType, reset]);

  const handleEdit = useCallback((c: SalaryComponent) => {
    reset({
      code: c.code,
      name: c.name,
      description: c.description || "",
      type: c.type,
      calculation_type: c.calculation_type,
      percentage_value: c.percentage_value ? String(c.percentage_value) : "",
      percentage_of: c.percentage_of || "",
      is_active: c.is_active,
    });
    setEditingId(c.id);
    setError("");
  }, [reset]);

  const handleDelete = useCallback(async () => {
    if (deleteTarget === null) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget);
      setSuccess("Component deleted.");
      setDeleteTarget(null);
    } catch { setError("Failed to delete component."); }
  }, [deleteTarget, deleteMutation]);

  const onSubmit = async (data: ComponentFormValues) => {
    setError("");
    setSuccess("");
    try {
      const payload: SalaryComponentData = {
        code: data.code,
        name: data.name,
        description: data.description || undefined,
        type: data.type,
        calculation_type: data.calculation_type,
        percentage_value: data.percentage_value ? Number(data.percentage_value) : undefined,
        percentage_of: data.percentage_of || undefined,
        is_active: data.is_active,
        tenant_location_id: "00000000-0000-0000-0000-000000000000",
      };
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, payload });
        setSuccess("Component updated.");
      } else {
        await createMutation.mutateAsync(payload);
        setSuccess("Component created.");
      }
      reset(EMPTY_FORM);
      setEditingId(null);
    } catch { setError("Failed to save component."); }
  };

  const resetForm = () => { reset(EMPTY_FORM); setEditingId(null); setError(""); };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-text-primary">
          {editingId ? "Edit Component" : "New Component"}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="Code" {...register("code")} error={errors.code?.message} />
          <Input label="Name" {...register("name")} error={errors.name?.message} />
          <Select label="Type" {...register("type")} error={errors.type?.message}
            options={[{ value: "earning", label: "Earning" }, { value: "deduction", label: "Deduction" }]} />
          <Select label="Calculation" {...register("calculation_type")} error={errors.calculation_type?.message}
            options={[{ value: "fixed", label: "Fixed" }, { value: "percentage", label: "Percentage" }]} />
          {watchedCalcType === "percentage" && (
            <>
              <Input label="Percentage Value" type="number" step="0.01" min="0" max="100" {...register("percentage_value")} error={errors.percentage_value?.message} />
              <Input label="Percentage Of" {...register("percentage_of")} error={errors.percentage_of?.message} placeholder="e.g. basic" />
            </>
          )}
          <Input label="Description" {...register("description")} />
          <label className="flex items-center gap-2 pt-6">
            <input type="checkbox" {...register("is_active")} className="h-4 w-4" />
            <span className="text-sm text-text-primary">Active</span>
          </label>
        </div>
        <div className="flex gap-3">
          <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
            {editingId ? "Update" : "Create"}
          </Button>
          {editingId && <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>}
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-secondary">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">Code</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">Name</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">Type</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">Calculation</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">Active</th>
              <th className="px-4 py-3 text-right font-medium text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {components.map((c: SalaryComponent) => (
              <tr key={c.id} className="hover:bg-surface-secondary/50">
                <td className="px-4 py-3 font-mono text-text-primary">{c.code}</td>
                <td className="px-4 py-3 text-text-primary">{c.name}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c.type === "earning" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{c.type}</span>
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {c.calculation_type === "percentage" ? `${c.percentage_value}% of ${c.percentage_of}` : "Fixed"}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c.is_active ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>{c.is_active ? "Yes" : "No"}</span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Can resource="payroll" action="process">
                    <button
                      onClick={() => handleEdit(c)}
                      className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(c.id)}
                      className="rounded-lg bg-danger px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity"
                    >
                      Delete
                    </button>
                  </Can>
                </td>
              </tr>
            ))}
            {components.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">No salary components yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Component"
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      >
        Are you sure you want to delete this salary component? This action cannot be undone.
      </Modal>
    </div>
  );
}
