"use client";

import { useSubdomain } from "@/hooks/use-subdomain";
import { LoginForm } from "@/features/auth/components/login-form";
import { WorkspaceFinder } from "@/features/tenant/components/workspace-finder";

export default function LoginPage() {
  const subdomain = useSubdomain();

  if (subdomain) {
    return <LoginForm workspace={subdomain} />;
  }

  return <WorkspaceFinder />;
}
