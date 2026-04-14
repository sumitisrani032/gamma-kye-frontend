"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSubdomain } from "@/hooks/use-subdomain";
import { TenantRegistrationForm } from "@/features/tenant/components/tenant-registration-form";

export default function RegisterPage() {
  const subdomain = useSubdomain();
  const router = useRouter();

  useEffect(() => {
    if (subdomain) {
      router.replace("/login");
    }
  }, [subdomain, router]);

  if (subdomain) return null;

  return <TenantRegistrationForm />;
}
