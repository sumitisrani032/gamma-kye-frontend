"use client";

import Link from "next/link";
import { Input, Alert } from "@/components/ui";
import { useDirectory } from "../hooks/use-directory";

export function DirectoryList() {
  const { loading, error, search, setSearch, filtered } = useDirectory();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <Input
        placeholder="Search by name, email, designation, department..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <p className="text-sm text-text-muted">{filtered.length} {filtered.length === 1 ? "person" : "people"}</p>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center text-sm text-text-muted">
          {search ? "No employees match your search." : "No employees found."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((emp) => (
            <Link
              key={emp.id}
              href={`/directory/${emp.id}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 hover:border-primary-300 hover:shadow-sm transition-all"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
                {emp.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text-primary truncate">{emp.full_name}</p>
                  {emp.work_mode && (
                    <span className="inline-flex items-center rounded bg-surface-tertiary px-1.5 py-0.5 text-[9px] font-bold text-text-muted uppercase">
                      {emp.work_mode === "wfh" ? "🏠 WFH" : emp.work_mode === "hybrid" ? "Hybrid" : "🏢 Office"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted truncate">{emp.designation} &middot; {emp.department}</p>
                <p className="text-xs text-text-muted truncate">{emp.location}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
