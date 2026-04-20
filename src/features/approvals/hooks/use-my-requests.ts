"use client";

import { useState, useEffect, useCallback } from "react";
import { getMyRequests } from "@/services/my-requests-service";
import { subscribeToInvalidate } from "@/lib/invalidate";
import type {
  MyRequest,
  MyRequestsParams,
  MyRequestsSummary,
} from "@/types";

interface UseMyRequestsReturn {
  requests: MyRequest[];
  summary: MyRequestsSummary | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
}

export function useMyRequests(params?: MyRequestsParams): UseMyRequestsReturn {
  const [requests, setRequests] = useState<MyRequest[]>([]);
  const [summary, setSummary] = useState<MyRequestsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyRequests(params);
      setRequests(data.my_requests);
      setSummary(data.summary);
    } catch {
      setError("Failed to load your requests.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.status, params?.type, params?.from, params?.to, params?.page, params?.per_page]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Refetch whenever any request-shaped action fires elsewhere in the app.
  useEffect(() => subscribeToInvalidate("my_requests", refresh), [refresh]);

  return { requests, summary, loading, error, refresh };
}
