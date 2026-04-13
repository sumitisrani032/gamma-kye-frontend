import { BASE_DOMAIN, API_PORT } from "./constants";

/**
 * Get the runtime protocol from the browser (falls back to "http:" for SSR).
 */
function getProtocol(): string {
  if (typeof window === "undefined") return "http:";
  return window.location.protocol;
}

/**
 * Extract the subdomain from a hostname.
 * Returns null if on the root domain or if the subdomain contains dots (nested).
 */
export function getSubdomain(hostname: string): string | null {
  const suffix = `.${BASE_DOMAIN}`;
  if (!hostname.endsWith(suffix) && hostname !== BASE_DOMAIN) return null;
  if (hostname === BASE_DOMAIN) return null;

  const subdomain = hostname.replace(suffix, "");
  if (subdomain.includes(".")) return null;
  return subdomain;
}

/**
 * Build the API base URL for the current tenant context.
 * Uses the same hostname as the page since the Rails backend resolves tenants by subdomain.
 */
export function getApiBaseUrl(hostname: string): string {
  const port = API_PORT ? `:${API_PORT}` : "";
  return `${getProtocol()}//${hostname}${port}`;
}

/**
 * Build the full URL for the main domain (no subdomain).
 */
export function getMainDomainUrl(): string {
  const port = API_PORT ? `:${API_PORT}` : "";
  return `${getProtocol()}//${BASE_DOMAIN}${port}`;
}

/**
 * Build the full URL for a specific tenant subdomain.
 */
export function getTenantUrl(subdomain: string): string {
  const port = API_PORT ? `:${API_PORT}` : "";
  return `${getProtocol()}//${subdomain}.${BASE_DOMAIN}${port}`;
}

/**
 * Build the frontend URL for a specific tenant subdomain.
 * Uses the current page's port (frontend dev server) rather than the API port.
 */
export function getTenantFrontendUrl(subdomain: string, currentPort?: string): string {
  const port = currentPort ? `:${currentPort}` : "";
  return `${getProtocol()}//${subdomain}.${BASE_DOMAIN}${port}`;
}

/**
 * Navigate the browser to a tenant subdomain path.
 * Centralizes the port-detection + redirect logic used across workspace finders.
 */
export function navigateToTenant(subdomain: string, path: string): void {
  const port = typeof window !== "undefined" ? window.location.port : "";
  window.location.href = `${getTenantFrontendUrl(subdomain, port)}${path}`;
}
