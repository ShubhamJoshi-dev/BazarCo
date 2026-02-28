import type { HealthResponse } from "@/types/api";
import { getBackendBaseUrl } from "@/config/env";

export async function fetchHealth(): Promise<HealthResponse> {
  const base = getBackendBaseUrl();
  const res = await fetch(`${base}/api/v1/health`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json() as Promise<HealthResponse>;
}
