export const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "lvh.me";
export const API_PORT = process.env.NEXT_PUBLIC_API_PORT || "";
export const PYTHON_API_PORT = process.env.NEXT_PUBLIC_PYTHON_API_PORT || "8000";

export const PLANS = [
  { value: "starter", label: "Starter" },
  { value: "professional", label: "Professional" },
  { value: "enterprise", label: "Enterprise" },
] as const;

export type PlanType = (typeof PLANS)[number]["value"];
