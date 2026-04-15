"use client";

import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { ThemeToggle } from "@/components/common/theme-toggle";

interface TopBarProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, description, actions }: TopBarProps) {
  return (
    <div className="border-b border-border bg-surface px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-text-secondary">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {actions}
          <ThemeToggle />
          <NotificationBell />
        </div>
      </div>
    </div>
  );
}
