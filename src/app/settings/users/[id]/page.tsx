"use client";

import { use } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { UserDetailView } from "@/features/users/components/user-detail-view";

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <>
      <TopBar title="User Details" />
      <div className="px-8 py-6">
        <UserDetailView id={id} />
      </div>
    </>
  );
}
