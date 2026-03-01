import type { Request, Response } from "express";
import type { Types } from "mongoose";
import { errorResponse, successResponse } from "../helpers/response.helper";
import * as favouriteRepo from "../repositories/favourite.repository";
import * as productRepo from "../repositories/product.repository";

type AuthUser = { id: string; role: string };
type ReqWithUser = Request & { user?: AuthUser };

export async function addFavourite(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const productId = req.params.productId;
  const product = await productRepo.findById(productId);
  if (!product) {
    errorResponse(res, 404, "Product not found");
    return;
  }
  const ok = await favouriteRepo.addFavourite(user.id, productId);
  if (!ok) {
    errorResponse(res, 400, "Already in favourites or invalid");
    return;
  }
  successResponse(res, 201, "Added to favourites");
}

export async function removeFavourite(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const productId = req.params.productId;
  const ok = await favouriteRepo.removeFavourite(user.id, productId);
  if (!ok) {
    errorResponse(res, 404, "Favourite not found");
    return;
  }
  successResponse(res, 200, "Removed from favourites");
}

export async function checkFavourite(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const productId = req.params.productId;
  const favourited = await favouriteRepo.isFavourite(user.id, productId);
  successResponse(res, 200, "OK", { favourited });
}

export async function listFavourites(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const productIds = await favouriteRepo.listFavouriteProductIds(user.id);
  const products: unknown[] = [];
  for (const id of productIds) {
    const doc = await productRepo.findById(id);
    if (doc) products.push(doc);
  }
  successResponse(res, 200, "Favourites listed", {
    products: products.map((p) => toProductDto(p as Record<string, unknown> & { _id: Types.ObjectId; sellerId: Types.ObjectId })),
  });
}

function toProductDto(doc: Record<string, unknown> & { _id: Types.ObjectId; sellerId: Types.ObjectId }) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    price: doc.price,
    imageUrl: doc.imageUrl,
    categoryId: doc.categoryId != null ? (doc.categoryId as Types.ObjectId).toString() : undefined,
    tagIds: Array.isArray(doc.tagIds) ? doc.tagIds.map((t: unknown) => (t as Types.ObjectId).toString()) : [],
    status: doc.status,
    sellerId: doc.sellerId.toString(),
  };
}
