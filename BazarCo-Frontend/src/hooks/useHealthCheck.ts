"use client";

import { useCallback, useState } from "react";
import { fetchHealth } from "@/lib/api";
import type { HealthResponse } from "@/types/api";

type HealthState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: HealthResponse }
  | { status: "error"; message: string };

export function useHealthCheck() {
  const [state, setState] = useState<HealthState>({ status: "idle" });

  const check = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const data = await fetchHealth();
      setState({ status: "success", data });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed";
      setState({ status: "error", message });
    }
  }, []);

  return { state, check };
}
