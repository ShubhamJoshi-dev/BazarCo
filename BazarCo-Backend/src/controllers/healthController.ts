import type { Request, Response } from "express";
import { env } from "../config/env.js";

/**
 * Health check response shape.
 */
export interface HealthResponse {
  status: "ok";
  timestamp: string;
  uptime: number;
  environment: string;
}


export function getHealth(_req: Request, res: Response): void {
  const payload: HealthResponse = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
  };
  res.status(200).json(payload);
}
