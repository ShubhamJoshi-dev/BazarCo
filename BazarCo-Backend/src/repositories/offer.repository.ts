import type { Types } from "mongoose";
import { Offer, type OfferStatus } from "../models/offer.model";

export async function createOffer(data: {
  productId: string | Types.ObjectId;
  buyerId: string | Types.ObjectId;
  sellerId: string | Types.ObjectId;
  proposedPrice: number;
  buyerMessage?: string;
}) {
  const doc = await Offer.create(data);
  return doc.toObject();
}

export async function findById(id: string) {
  const doc = await Offer.findById(id)
    .populate("productId", "name price imageUrl")
    .populate("buyerId", "name email")
    .populate("sellerId", "name email")
    .lean();
  return doc ?? null;
}

export async function findByBuyerId(buyerId: string, options?: { status?: OfferStatus }) {
  const query: Record<string, unknown> = { buyerId };
  if (options?.status) query.status = options.status;
  const docs = await Offer.find(query)
    .populate("productId", "name price imageUrl")
    .populate("sellerId", "name email")
    .sort({ updatedAt: -1 })
    .lean();
  return docs;
}

export async function findBySellerId(sellerId: string, options?: { status?: OfferStatus }) {
  const query: Record<string, unknown> = { sellerId };
  if (options?.status) query.status = options.status;
  const docs = await Offer.find(query)
    .populate("productId", "name price imageUrl")
    .populate("buyerId", "name email")
    .sort({ updatedAt: -1 })
    .lean();
  return docs;
}

export async function acceptOffer(offerId: string, sellerId: string) {
  const doc = await Offer.findOneAndUpdate(
    { _id: offerId, sellerId, status: "pending" },
    { $set: { status: "accepted" } },
    { new: true }
  )
    .populate("productId", "name price imageUrl")
    .populate("buyerId", "name email")
    .lean();
  return doc ?? null;
}

export async function rejectOffer(offerId: string, sellerId: string, sellerMessage?: string) {
  const update: Record<string, unknown> = { status: "rejected" };
  if (sellerMessage != null) update.sellerMessage = sellerMessage;
  const doc = await Offer.findOneAndUpdate(
    { _id: offerId, sellerId, status: "pending" },
    { $set: update },
    { new: true }
  )
    .populate("productId", "name price imageUrl")
    .populate("buyerId", "name email")
    .lean();
  return doc ?? null;
}

export async function counterOffer(
  offerId: string,
  sellerId: string,
  counterPrice: number,
  counterMessage?: string
) {
  const update: Record<string, unknown> = {
    status: "countered",
    counterPrice,
    counterMessage: counterMessage ?? "",
  };
  const doc = await Offer.findOneAndUpdate(
    { _id: offerId, sellerId, status: "pending" },
    { $set: update },
    { new: true }
  )
    .populate("productId", "name price imageUrl")
    .populate("buyerId", "name email")
    .lean();
  return doc ?? null;
}

export async function acceptCounter(offerId: string, buyerId: string) {
  const doc = await Offer.findOneAndUpdate(
    { _id: offerId, buyerId, status: "countered" },
    { $set: { status: "accepted" } },
    { new: true }
  )
    .populate("productId", "name price imageUrl")
    .populate("sellerId", "name email")
    .lean();
  return doc ?? null;
}

export async function respondToCounter(
  offerId: string,
  buyerId: string,
  proposedPrice: number,
  buyerMessage?: string
) {
  const doc = await Offer.findOneAndUpdate(
    { _id: offerId, buyerId, status: "countered" },
    {
      $set: {
        status: "pending",
        proposedPrice,
        buyerMessage: buyerMessage ?? "",
      },
      $unset: { counterPrice: "", counterMessage: "" },
    },
    { new: true }
  )
    .populate("productId", "name price imageUrl")
    .populate("sellerId", "name email")
    .lean();
  return doc ?? null;
}
