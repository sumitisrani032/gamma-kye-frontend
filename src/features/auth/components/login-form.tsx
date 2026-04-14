"use client";

import { Button, Input, Alert } from "@/components/ui";
import { useLogin } from "../hooks/use-login";

interface LoginFormProps {
  workspace: string;
}

export function LoginForm({ workspace }: LoginFormProps) {
  const { email, setEmail, password, setPassword, error, loading, handleSubmit } =
    useLogin();

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary-600">GammaKYE</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Sign in to{" "}
            <span className="font-medium text-text-primary">{workspace}</span>
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface rounded-xl border border-border shadow-sm p-8 space-y-5"
        >
          {error && <Alert variant="error">{error}</Alert>}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            autoComplete="current-password"
          />

          <Button type="submit" className="w-full" loading={loading}>
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
