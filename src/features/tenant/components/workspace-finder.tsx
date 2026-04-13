"use client";

import Link from "next/link";
import { Button, Input, Alert } from "@/components/ui";
import { useWorkspaceCheck } from "../hooks/use-workspace-check";

export function WorkspaceFinder() {
  const {
    subdomain,
    setSubdomain,
    normalized,
    error,
    loading,
    clearError,
    handleCheck,
  } = useWorkspaceCheck("/login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary-600">GammaKYE</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Enter your workspace name to continue
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCheck();
          }}
          className="bg-surface rounded-xl border border-border shadow-sm p-8 space-y-5"
        >
          {error && error !== "not_found" && error !== "suspended" && (
            <Alert variant="error">{error}</Alert>
          )}

          {error === "suspended" && (
            <Alert variant="error">
              This workspace is suspended. Please contact your administrator.
            </Alert>
          )}

          {error === "not_found" && (
            <Alert variant="warning">
              Workspace not found.{" "}
              <Link
                href="/register"
                className="font-medium underline hover:text-primary-700"
              >
                Want to create one?
              </Link>
            </Alert>
          )}

          <Input
            label="Workspace"
            value={subdomain}
            onChange={(e) => {
              setSubdomain(e.target.value);
              clearError();
            }}
            placeholder="your-company"
            required
            autoComplete="organization"
          />

          <Button
            type="submit"
            className="w-full"
            loading={loading}
            disabled={!normalized}
          >
            Continue
          </Button>

          <p className="text-center text-sm text-text-secondary">
            Don&apos;t have a workspace?{" "}
            <Link
              href="/register"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
