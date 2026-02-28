import type { Request, Response } from "express";
import * as healthService from "../services/health.service";

export function getHealth(_req: Request, res: Response): void {
  const payload = healthService.getHealth();
  res.status(200).json(payload);
}
