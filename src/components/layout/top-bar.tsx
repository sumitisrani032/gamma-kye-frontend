"use client";

import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { useSidebar } from "@/components/layout/tenant-sidebar";

interface TopBarProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, description, actions }: TopBarProps) {
  const { toggle } = useSidebar();

  return (
    <div className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-sm px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile hamburger */}
          <button
            onClick={toggle}
            className="lg:hidden text-text-secondary hover:text-text-primary p-1 -ml-1 rounded-md hover:bg-surface-tertiary"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-text-primary truncate sm:text-xl">{title}</h1>
            {description && (
              <p className="text-xs text-text-muted truncate sm:text-sm">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {actions}
          <ThemeToggle />
          <NotificationBell />
        </div>
      </div>
    </div>
  );
}
