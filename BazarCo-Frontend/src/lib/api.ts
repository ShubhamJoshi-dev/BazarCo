import type { HealthResponse, NotifyResponse } from "@/types/api";
import { getBackendBaseUrl } from "@/config/env";

export async function fetchHealth(): Promise<HealthResponse> {
  const base = getBackendBaseUrl();
  const res = await fetch(`${base}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json() as Promise<HealthResponse>;
}

export async function notifySignUp(email: string): Promise<NotifyResponse> {
  const base = getBackendBaseUrl();
  const res = await fetch(`${base}/notify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim() }),
  });
  const data = (await res.json()) as NotifyResponse;
  if (!res.ok) {
    return {
      status: "error",
      message: data.status === "error" ? data.message : "Something went wrong",
    };
  }
  return data;
}
