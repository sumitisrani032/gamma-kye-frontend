/**
 * Lightweight cross-feature invalidation channel.
 *
 * When the user completes any request-shaped action (apply/cancel/approve/
 * reject on a leave, WFH, or regularization, or a clock in/out), other
 * open views may be showing stale state — the calendar, the My Requests
 * tab, the leave balance card, today's attendance widget, etc.
 *
 * Instead of threading props through every consumer we dispatch a browser
 * CustomEvent. Any hook that holds list state subscribes via
 * `subscribeToInvalidate` and refetches.
 *
 * This is not a replacement for server-state caching (React Query, SWR)
 * but it gives us a uniform signal across the app without that dependency.
 */

export type InvalidateKey =
  | "my_requests"
  | "calendar"
  | "attendance"
  | "today"
  | "leave_balances"
  | "workflow_instances"
  | "wfh";

const EVENT_NAME = "requests:invalidate";

interface InvalidateDetail {
  keys: InvalidateKey[];
}

/** Fire an invalidation signal for one or more data scopes. */
export function invalidateRequests(keys: InvalidateKey | InvalidateKey[]): void {
  if (typeof window === "undefined") return;
  const payload: InvalidateDetail = {
    keys: Array.isArray(keys) ? keys : [keys],
  };
  window.dispatchEvent(new CustomEvent<InvalidateDetail>(EVENT_NAME, { detail: payload }));
}

/** Fire-and-forget helper for the common "everything touched by a request action" case. */
export function invalidateAllRequestData(): void {
  invalidateRequests([
    "my_requests",
    "calendar",
    "attendance",
    "today",
    "leave_balances",
    "workflow_instances",
    "wfh",
  ]);
}

/**
 * Subscribe to invalidation events. The handler is called whenever any of
 * the supplied keys appears in the event payload. Returns an unsubscribe
 * function suitable for a React useEffect cleanup.
 */
export function subscribeToInvalidate(
  keys: InvalidateKey | InvalidateKey[],
  handler: () => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const watched = new Set(Array.isArray(keys) ? keys : [keys]);
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<InvalidateDetail>).detail;
    if (!detail) return;
    if (detail.keys.some((k) => watched.has(k))) handler();
  };
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
