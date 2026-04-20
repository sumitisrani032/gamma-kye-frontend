"use client";

import { RequestCard } from "./request-card";
import type { RequestEntity } from "@/types";

interface MyRequestsListProps {
  requests: RequestEntity[];
}

export function MyRequestsList({ requests }: MyRequestsListProps) {
  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center text-sm text-text-muted">
        You haven&apos;t submitted any requests yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <RequestCard key={`${req.type}:${req.id}`} entity={req} />
      ))}
    </div>
  );
}
