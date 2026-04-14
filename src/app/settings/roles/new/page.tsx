"use client";

import { TopBar } from "@/components/layout/top-bar";
import { CreateRoleForm } from "@/features/roles/components/create-role-form";

export default function NewRolePage() {
  return (
    <>
      <TopBar title="Create Role" />
      <div className="px-8 py-6">
        <CreateRoleForm />
      </div>
    </>
  );
}
