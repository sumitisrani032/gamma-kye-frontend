"use client";

import type { Notification } from "@/types";

interface NotificationPanelProps {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  workflow_action: "bg-primary-100 text-primary-700",
  workflow_complete: "bg-accent-100 text-accent-700",
  info: "bg-blue-100 text-blue-700",
  warning: "bg-yellow-100 text-yellow-700",
  system: "bg-surface-tertiary text-text-secondary",
};

function getDeepLink(referenceType: string | null, referenceId: string | null): string | null {
  if (!referenceType || !referenceId) return null;
  const routes: Record<string, string> = {
    workflow_instance: `/approvals/${referenceId}`,
    leave_request: `/leaves/${referenceId}`,
    employee: `/employees/${referenceId}`,
    attendance: `/attendance/${referenceId}`,
  };
  return routes[referenceType] || null;
}

function timeAgo(dateString: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationPanel({
  notifications,
  unreadCount,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
}: NotificationPanelProps) {
  const handleClick = (n: Notification) => {
    if (!n.is_read) onMarkAsRead(n.id);
    const link = getDeepLink(n.reference_type, n.reference_id);
    if (link) {
      onClose();
      window.location.href = link;
    }
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-96 rounded-xl border border-border bg-surface shadow-lg z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary">
          Notifications
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading && (
          <div className="px-4 py-8 text-center text-sm text-text-muted">
            Loading...
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-text-muted">
            No notifications yet
          </div>
        )}

        {!loading &&
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`w-full text-left px-4 py-3 border-b border-border last:border-b-0 hover:bg-surface-secondary transition-colors ${
                !n.is_read ? "bg-primary-50/50" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                {!n.is_read && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-600" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        TYPE_COLORS[n.notification_type] || TYPE_COLORS.system
                      }`}
                    >
                      {n.notification_type.replace("_", " ")}
                    </span>
                    <span className="text-xs text-text-muted">
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-text-primary truncate">
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-xs text-text-secondary line-clamp-2">
                    {n.body}
                  </p>
                </div>
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}
