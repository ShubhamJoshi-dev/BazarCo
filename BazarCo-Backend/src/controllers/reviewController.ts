import type { Request, Response } from "express";
import { errorResponse, successResponse } from "../helpers/response.helper";
import * as reviewRepo from "../repositories/review.repository";
import * as productRepo from "../repositories/product.repository";

type ReqWithUser = Request & { user?: { id: string } };

export async function addOrUpdateReview(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const productId = req.params.id;
  const rating = typeof req.body.rating === "number" ? Math.min(5, Math.max(1, Math.floor(req.body.rating))) : undefined;
  const comment = typeof req.body.comment === "string" ? req.body.comment.trim().slice(0, 2000) : undefined;

  if (rating === undefined) {
    errorResponse(res, 400, "Rating (1-5) is required");
    return;
  }

  const product = await productRepo.findById(productId);
  if (!product) {
    errorResponse(res, 404, "Product not found");
    return;
  }

  const existing = await reviewRepo.findUserReview(productId, user.id);
  if (existing) {
    const updated = await reviewRepo.updateReview(productId, user.id, { rating, comment });
    if (!updated) {
      errorResponse(res, 500, "Failed to update review");
      return;
    }
    const u = updated as { _id: { toString(): string }; userId: unknown; rating: number; comment?: string; createdAt: Date };
    successResponse(res, 200, "Review updated", {
      review: {
        id: u._id.toString(),
        userId: u.userId?.toString?.() ?? u.userId,
        rating: u.rating,
        comment: u.comment,
        createdAt: u.createdAt?.toISOString?.(),
      },
    });
    return;
  }

  const created = await reviewRepo.createReview({
    productId,
    userId: user.id,
    rating,
    comment,
  });
  const c = created as { _id: { toString(): string }; userId: unknown; rating: number; comment?: string; createdAt: Date };
  successResponse(res, 201, "Review added", {
    review: {
      id: c._id.toString(),
      userId: c.userId?.toString?.() ?? c.userId,
      rating: c.rating,
      comment: c.comment,
      createdAt: c.createdAt?.toISOString?.(),
    },
  });
}
