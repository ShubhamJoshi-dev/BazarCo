import mongoose from "mongoose";
import type { HealthResponse } from "../interfaces/health";
import { env } from "../config/env";

export function getHealth(): HealthResponse {
  const dbState = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    db: dbState,
  };
}
