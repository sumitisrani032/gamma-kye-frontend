"use client";

import { useState } from "react";
import { Button, Alert } from "@/components/ui";

interface ApprovalActionsProps {
  showApproveReject?: boolean;
  showCancel?: boolean;
  onApprove: (comments: string) => Promise<void>;
  onReject: (comments: string) => Promise<void>;
  onCancel: () => Promise<void>;
  loading: boolean;
  error: string;
}

export function ApprovalActions({
  showApproveReject = false,
  showCancel = false,
  onApprove,
  onReject,
  onCancel,
  loading,
  error,
}: ApprovalActionsProps) {
  const [comments, setComments] = useState("");

  if (!showApproveReject && !showCancel) return null;

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      {showApproveReject && (
        <div className="space-y-1">
          <label
            htmlFor="approval-comments"
            className="block text-sm font-medium text-text-primary"
          >
            Comments
          </label>
          <textarea
            id="approval-comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add a comment (optional)..."
            rows={3}
            className="block w-full rounded-lg border border-border px-3 py-2 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        {showApproveReject && (
          <>
            <Button
              onClick={() => onApprove(comments)}
              loading={loading}
              disabled={loading}
            >
              Approve
            </Button>
            <Button
              variant="danger"
              onClick={() => onReject(comments)}
              loading={loading}
              disabled={loading}
            >
              Reject
            </Button>
          </>
        )}
        {showCancel && (
          <Button
            variant="ghost"
            onClick={onCancel}
            loading={loading}
            disabled={loading}
          >
            Cancel Request
          </Button>
        )}
      </div>
    </div>
  );
}
