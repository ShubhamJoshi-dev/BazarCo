import type { Request, Response } from "express";
import { errorResponse, successResponse } from "../helpers/response.helper";
import * as reviewRepo from "../repositories/review.repository";
import * as productRepo from "../repositories/product.repository";
import * as reactionRepo from "../repositories/reviewReaction.repository";
import { uploadReviewImage } from "../services/cloudinary.service";

type ReqWithUser = Request & { user?: { id: string } };

function toReviewDto(doc: { _id: { toString(): string }; userId: unknown; parentId?: unknown; rating?: number; comment?: string; imageUrls?: string[]; createdAt: Date }) {
  return {
    id: doc._id.toString(),
    userId: doc.userId?.toString?.() ?? doc.userId,
    parentId: doc.parentId?.toString?.() ?? doc.parentId ?? undefined,
    rating: doc.rating,
    comment: doc.comment,
    imageUrls: Array.isArray(doc.imageUrls) ? doc.imageUrls : [],
    createdAt: doc.createdAt?.toISOString?.(),
  };
}

export async function addOrUpdateReview(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const productId = req.params.id;
  const parentId = typeof req.body.parentId === "string" ? req.body.parentId.trim() || undefined : undefined;
  const rating = typeof req.body.rating === "number" ? Math.min(5, Math.max(1, Math.floor(req.body.rating))) : undefined;
  const comment = typeof req.body.comment === "string" ? req.body.comment.trim().slice(0, 2000) : undefined;
  const imageUrls = Array.isArray(req.body.imageUrls) ? req.body.imageUrls.filter((u: unknown) => typeof u === "string").slice(0, 5) : [];

  const product = await productRepo.findById(productId);
  if (!product) {
    errorResponse(res, 404, "Product not found");
    return;
  }

  if (parentId) {
    const parent = await reviewRepo.findById(parentId);
    const parentDoc = parent as { productId?: { toString(): string }; parentId?: unknown } | null;
    if (!parent || parentDoc?.productId?.toString?.() !== productId || parentDoc?.parentId) {
      errorResponse(res, 400, "Invalid reply target");
      return;
    }
    if (!comment || !comment.length) {
      errorResponse(res, 400, "Comment is required for a reply");
      return;
    }
    const created = await reviewRepo.createReview({
      productId,
      userId: user.id,
      parentId,
      comment,
      imageUrls: imageUrls.length ? imageUrls : undefined,
    });
    const c = created as { _id: { toString(): string }; userId: unknown; parentId: unknown; comment?: string; imageUrls?: string[]; createdAt: Date };
    successResponse(res, 201, "Reply added", { review: toReviewDto(c) });
    return;
  }

  if (rating === undefined) {
    errorResponse(res, 400, "Rating (1-5) is required");
    return;
  }

  const existing = await reviewRepo.findUserReview(productId, user.id);
  if (existing) {
    const updated = await reviewRepo.updateReview(productId, user.id, { rating, comment, imageUrls: imageUrls.length ? imageUrls : undefined });
    if (!updated) {
      errorResponse(res, 500, "Failed to update review");
      return;
    }
    successResponse(res, 200, "Review updated", { review: toReviewDto(updated as Parameters<typeof toReviewDto>[0]) });
    return;
  }

  const created = await reviewRepo.createReview({
    productId,
    userId: user.id,
    rating,
    comment,
    imageUrls: imageUrls.length ? imageUrls : undefined,
  });
  successResponse(res, 201, "Review added", { review: toReviewDto(created as Parameters<typeof toReviewDto>[0]) });
}

export async function addReaction(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const productId = req.params.id;
  const reviewId = req.params.reviewId;
  const type = req.body.type === "like" || req.body.type === "dislike" ? req.body.type : undefined;
  if (!type) {
    errorResponse(res, 400, "type must be 'like' or 'dislike'");
    return;
  }
  const product = await productRepo.findById(productId);
  if (!product) {
    errorResponse(res, 404, "Product not found");
    return;
  }
  const review = await reviewRepo.findById(reviewId);
  const rev = review as { productId?: { toString(): string } } | null;
  if (!review || rev?.productId?.toString?.() !== productId) {
    errorResponse(res, 404, "Review not found");
    return;
  }
  const result = await reactionRepo.setReaction(reviewId, user.id, type);
  successResponse(res, 200, "Reaction updated", result);
}

export async function uploadReviewImageHandler(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const productId = req.params.id;
  const product = await productRepo.findById(productId);
  if (!product) {
    errorResponse(res, 404, "Product not found");
    return;
  }
  const file = req.file as Express.Multer.File | undefined;
  if (!file?.buffer) {
    errorResponse(res, 400, "No image file uploaded");
    return;
  }
  const url = await uploadReviewImage(file.buffer);
  if (!url) {
    errorResponse(res, 500, "Failed to upload image");
    return;
  }
  successResponse(res, 200, "Image uploaded", { url });
}
