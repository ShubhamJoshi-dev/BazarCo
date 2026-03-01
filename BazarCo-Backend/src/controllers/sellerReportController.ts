import type { Request, Response } from "express";
import type { Types } from "mongoose";
import { errorResponse, successResponse } from "../helpers/response.helper";
import * as productRepo from "../repositories/product.repository";
import * as orderRepo from "../repositories/order.repository";
import * as userRepo from "../repositories/user.repository";

type ReqWithUser = Request & { user?: { id: string } };

export async function getReport(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }

  try {
    const profile = await userRepo.findById(user.id);
    const rating = (profile as { rating?: number } | null)?.rating ?? 0;
    const ratingCount = (profile as { ratingCount?: number } | null)?.ratingCount ?? 0;

    const [stats, productList, orderStats] = await Promise.all([
      productRepo.getSellerProductStats(user.id),
      productRepo.findBySellerId(user.id),
      orderRepo.getSellerOrderStats(user.id),
    ]);

    const salesTotal = orderStats.completed.reduce((sum, o) => sum + o.total, 0);

    const productListDto = productList.map((p) => {
      const doc = p as Record<string, unknown> & { _id: Types.ObjectId; name: string; status: string };
      return { id: doc._id.toString(), name: doc.name, status: doc.status ?? "active" };
    });

    successResponse(res, 200, "Report loaded", {
      rating,
      ratingCount,
      productsTotal: stats.total,
      productsActive: stats.active,
      productsArchived: stats.archived,
      salesTotal,
      productsByCategory: stats.byCategory ?? [],
      productList: productListDto,
      productsSold: orderStats.productsSold,
      soldCount: orderStats.soldCount,
      ordersCompleted: orderStats.completed,
      ordersInProgress: orderStats.inProgress,
    });
  } catch (err) {
    console.error("Seller report error:", err);
    errorResponse(res, 500, "Failed to load report");
  }
}
