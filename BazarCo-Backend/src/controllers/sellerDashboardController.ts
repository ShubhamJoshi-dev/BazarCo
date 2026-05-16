import type { Request, Response } from "express";
import { errorResponse, successResponse } from "../helpers/response.helper";
import * as orderRepo from "../repositories/order.repository";

type ReqWithUser = Request & { user?: { id: string } };

export async function getDashboard(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }

  const daysParam = req.query.days;
  const days =
    typeof daysParam === "string" && /^\d+$/.test(daysParam)
      ? parseInt(daysParam, 10)
      : 30;

  try {
    const dashboard = await orderRepo.getSellerDashboardData(user.id, { days });
    successResponse(res, 200, "Dashboard loaded", { dashboard });
  } catch (err) {
    console.error("Seller dashboard error:", err);
    errorResponse(res, 500, "Failed to load dashboard");
  }
}
