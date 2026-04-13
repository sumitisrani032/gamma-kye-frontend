"use client";

import { useSubdomain } from "@/hooks/use-subdomain";
import { TenantRegistrationForm } from "@/features/tenant/components/tenant-registration-form";
import { UserRegistrationForm } from "@/features/auth/components/user-registration-form";

export default function RegisterPage() {
  const subdomain = useSubdomain();

  if (subdomain) {
    return <UserRegistrationForm subdomain={subdomain} />;
  }

  return <TenantRegistrationForm />;
}
