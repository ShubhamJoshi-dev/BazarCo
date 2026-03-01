import type { Request, Response } from "express";
import { errorResponse, successResponse } from "../helpers/response.helper";
import * as likeRepo from "../repositories/like.repository";
import * as productRepo from "../repositories/product.repository";

type ReqWithUser = Request & { user?: { id: string } };

export async function toggleLike(req: ReqWithUser, res: Response): Promise<void> {
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
  const result = await likeRepo.toggleLike(productId, user.id);
  const count = await likeRepo.countByProduct(productId);
  successResponse(res, 200, result.liked ? "Liked" : "Unliked", {
    liked: result.liked,
    likeCount: count,
  });
}
