"use client";

import { use } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { RoleDetailView } from "@/features/roles/components/role-detail-view";

export default function RoleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <>
      <TopBar title="Role Details" />
      <div className="px-8 py-6">
        <RoleDetailView id={id} />
      </div>
    </>
  );
}
