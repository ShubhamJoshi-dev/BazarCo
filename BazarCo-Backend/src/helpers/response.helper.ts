import type { Response } from "express";

export function successResponse(
  res: Response,
  statusCode: number,
  message: string,
  data?: Record<string, unknown>
): void {
  res.status(statusCode).json({
    status: "success",
    message,
    ...data,
  });
}

export function errorResponse(
  res: Response,
  statusCode: number,
  message: string,
  data?: Record<string, unknown>
): void {
  res.status(statusCode).json({
    status: "error",
    message,
    ...data,
  });
}
