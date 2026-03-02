import type { Request, Response } from "express";
import { Types } from "mongoose";
import { errorResponse, successResponse } from "../helpers/response.helper";
import * as offerRepo from "../repositories/offer.repository";
import * as productRepo from "../repositories/product.repository";

type ReqWithUser = Request & { user?: { id: string } };

function toOfferDto(doc: Record<string, unknown> & {
  _id: Types.ObjectId;
  productId: unknown;
  buyerId: unknown;
  sellerId: unknown;
  proposedPrice: number;
  status: string;
  buyerMessage?: string;
  sellerMessage?: string;
  counterPrice?: number;
  counterMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  const product = doc.productId as { _id: Types.ObjectId; name?: string; price?: number; imageUrl?: string } | null;
  const buyer = doc.buyerId as { _id: Types.ObjectId; name?: string; email?: string } | null;
  const seller = doc.sellerId as { _id: Types.ObjectId; name?: string; email?: string } | null;
  return {
    id: doc._id.toString(),
    productId: (product?._id ?? doc.productId)?.toString?.() ?? doc.productId,
    product: product ? { id: product._id.toString(), name: product.name, price: product.price, imageUrl: product.imageUrl } : null,
    buyerId: (buyer?._id ?? doc.buyerId)?.toString?.() ?? doc.buyerId,
    buyer: buyer ? { id: buyer._id.toString(), name: buyer.name, email: buyer.email } : null,
    sellerId: (seller?._id ?? doc.sellerId)?.toString?.() ?? doc.sellerId,
    seller: seller ? { id: seller._id.toString(), name: seller.name, email: seller.email } : null,
    proposedPrice: doc.proposedPrice,
    status: doc.status,
    buyerMessage: doc.buyerMessage ?? null,
    sellerMessage: doc.sellerMessage ?? null,
    counterPrice: doc.counterPrice ?? null,
    counterMessage: doc.counterMessage ?? null,
    createdAt: doc.createdAt?.toISOString?.(),
    updatedAt: doc.updatedAt?.toISOString?.(),
  };
}

export async function createOffer(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const body = req.body as { productId?: string; proposedPrice?: number; message?: string };
  const productId = typeof body.productId === "string" ? body.productId.trim() : undefined;
  const proposedPrice = typeof body.proposedPrice === "number" ? body.proposedPrice : Number(body.proposedPrice);
  const buyerMessage = typeof body.message === "string" ? body.message.trim() : undefined;

  if (!productId || Number.isNaN(proposedPrice) || proposedPrice < 0) {
    errorResponse(res, 400, "productId and proposedPrice (non-negative) are required");
    return;
  }

  const product = await productRepo.findById(productId);
  if (!product) {
    errorResponse(res, 404, "Product not found");
    return;
  }
  const p = product as Record<string, unknown> & { sellerId: Types.ObjectId };
  const sellerId = p.sellerId?.toString?.() ?? p.sellerId;
  if (sellerId === user.id) {
    errorResponse(res, 400, "You cannot make an offer on your own product");
    return;
  }

  const created = await offerRepo.createOffer({
    productId,
    buyerId: user.id,
    sellerId,
    proposedPrice,
    buyerMessage,
  });
  const id = (created as { _id: Types.ObjectId })._id?.toString();
  const full = id ? await offerRepo.findById(id) : null;
  successResponse(res, 201, "Offer created", {
    offer: full ? toOfferDto(full as Parameters<typeof toOfferDto>[0]) : toOfferDto(created as Parameters<typeof toOfferDto>[0]),
  });
}

export async function listOffers(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const asSeller = req.query.as === "seller";
  const status = typeof req.query.status === "string" && ["pending", "accepted", "rejected", "countered"].includes(req.query.status)
    ? req.query.status
    : undefined;

  const docs = asSeller
    ? await offerRepo.findBySellerId(user.id, status ? { status } : undefined)
    : await offerRepo.findByBuyerId(user.id, status ? { status } : undefined);

  const offers = docs.map((d) => toOfferDto(d as Parameters<typeof toOfferDto>[0]));
  successResponse(res, 200, "Offers listed", { offers });
}

export async function getOfferById(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const offerId = req.params.id;
  const offer = await offerRepo.findById(offerId);
  if (!offer) {
    errorResponse(res, 404, "Offer not found");
    return;
  }
  const doc = offer as Record<string, unknown> & { buyerId: Types.ObjectId; sellerId: Types.ObjectId };
  const buyerId = doc.buyerId?.toString?.() ?? doc.buyerId;
  const sellerId = doc.sellerId?.toString?.() ?? doc.sellerId;
  if (buyerId !== user.id && sellerId !== user.id) {
    errorResponse(res, 404, "Offer not found");
    return;
  }
  successResponse(res, 200, "Offer", { offer: toOfferDto(offer as Parameters<typeof toOfferDto>[0]) });
}

export async function acceptOffer(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const offerId = req.params.id;
  const updated = await offerRepo.acceptOffer(offerId, user.id);
  if (!updated) {
    errorResponse(res, 404, "Offer not found or not pending");
    return;
  }
  successResponse(res, 200, "Offer accepted", { offer: toOfferDto(updated as Parameters<typeof toOfferDto>[0]) });
}

export async function rejectOffer(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const offerId = req.params.id;
  const message = typeof req.body.message === "string" ? req.body.message.trim() : undefined;
  const updated = await offerRepo.rejectOffer(offerId, user.id, message);
  if (!updated) {
    errorResponse(res, 404, "Offer not found or not pending");
    return;
  }
  successResponse(res, 200, "Offer rejected", { offer: toOfferDto(updated as Parameters<typeof toOfferDto>[0]) });
}

export async function counterOffer(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const offerId = req.params.id;
  const body = req.body as { counterPrice?: number; message?: string };
  const counterPrice = typeof body.counterPrice === "number" ? body.counterPrice : Number(body.counterPrice);
  const counterMessage = typeof body.message === "string" ? body.message.trim() : undefined;

  if (Number.isNaN(counterPrice) || counterPrice < 0) {
    errorResponse(res, 400, "counterPrice (non-negative) is required");
    return;
  }

  const updated = await offerRepo.counterOffer(offerId, user.id, counterPrice, counterMessage);
  if (!updated) {
    errorResponse(res, 404, "Offer not found or not pending");
    return;
  }
  successResponse(res, 200, "Counter offer sent", { offer: toOfferDto(updated as Parameters<typeof toOfferDto>[0]) });
}

export async function acceptCounter(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const offerId = req.params.id;
  const updated = await offerRepo.acceptCounter(offerId, user.id);
  if (!updated) {
    errorResponse(res, 404, "Offer not found or not countered");
    return;
  }
  successResponse(res, 200, "Counter accepted", { offer: toOfferDto(updated as Parameters<typeof toOfferDto>[0]) });
}

export async function respondToCounter(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const offerId = req.params.id;
  const body = req.body as { proposedPrice?: number; message?: string };
  const proposedPrice = typeof body.proposedPrice === "number" ? body.proposedPrice : Number(body.proposedPrice);
  const buyerMessage = typeof body.message === "string" ? body.message.trim() : undefined;

  if (Number.isNaN(proposedPrice) || proposedPrice < 0) {
    errorResponse(res, 400, "proposedPrice (non-negative) is required");
    return;
  }

  const updated = await offerRepo.respondToCounter(offerId, user.id, proposedPrice, buyerMessage);
  if (!updated) {
    errorResponse(res, 404, "Offer not found or not countered");
    return;
  }
  successResponse(res, 200, "Response sent", { offer: toOfferDto(updated as Parameters<typeof toOfferDto>[0]) });
}
