import type { Request, Response } from "express";
import { errorResponse, successResponse } from "../helpers/response.helper";
import * as analyticsRepo from "../repositories/sellerAnalytics.repository";

type ReqWithUser = Request & { user?: { id: string } };

export async function getAnalytics(req: ReqWithUser, res: Response): Promise<void> {
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
    const analytics = await analyticsRepo.getSellerAnalyticsData(user.id, { days });
    successResponse(res, 200, "Analytics loaded", { analytics });
  } catch (err) {
    console.error("Seller analytics error:", err);
    errorResponse(res, 500, "Failed to load analytics");
  }
}
