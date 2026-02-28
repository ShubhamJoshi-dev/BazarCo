import type { Request, Response } from "express";
import mongoose from "mongoose";
import type { HealthResponse } from "../interfaces/health";
import { env } from "../config/env";

export function getHealth(_req: Request, res: Response): void {
  const dbState = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  const payload: HealthResponse = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    db: dbState,
  };
  res.status(200).json(payload);
}
