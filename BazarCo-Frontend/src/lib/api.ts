import axios from "axios";
import type { HealthResponse, NotifyResponse } from "@/types/api";
import { getBackendBaseUrl } from "@/config/env";

const api = axios.create({
  baseURL: getBackendBaseUrl(),
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

export async function fetchHealth(): Promise<HealthResponse> {
  const { data } = await api.get<HealthResponse>("/health");
  return data;
}

export async function notifySignUp(email: string): Promise<NotifyResponse> {
  try {
    const { data } = await api.post<NotifyResponse>("/notify", {
      email: email.trim(),
    });
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      const body = err.response.data as NotifyResponse;
      return {
        status: "error",
        message: body.status === "error" ? body.message : "Something went wrong",
      };
    }
    return {
      status: "error",
      message: "Could not reach the server. Try again later.",
    };
  }
}
