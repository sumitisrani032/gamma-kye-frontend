"use client";

import { TopBar } from "@/components/layout/top-bar";
import { Can } from "@/components/common/can";
import { UserList } from "@/features/users/components/user-list";
import { Alert } from "@/components/ui";

export default function UsersPage() {
  return (
    <>
      <TopBar title="User Management" description="Manage users, their roles, and account status" />
      <div className="px-8 py-6">
        <Can
          resource="user"
          action="read"
          fallback={
            <Alert variant="warning">
              You don&apos;t have permission to manage users.
            </Alert>
          }
        >
          <UserList />
        </Can>
      </div>
    </>
  );
}
