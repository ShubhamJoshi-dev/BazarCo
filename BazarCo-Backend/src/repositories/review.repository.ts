import type { Types } from "mongoose";
import { Review } from "../models/review.model";

export async function createReview(data: {
  productId: string | Types.ObjectId;
  userId: string | Types.ObjectId;
  parentId?: string | Types.ObjectId | null;
  rating?: number;
  comment?: string;
  imageUrls?: string[];
}) {
  const doc = await Review.create(data);
  return doc.toObject();
}

export async function findByProduct(productId: string, limit = 50) {
  const docs = await Review.find({ productId, parentId: null }).sort({ createdAt: -1 }).limit(limit).lean();
  return docs;
}

export async function findRepliesByParentIds(parentIds: string[]): Promise<Map<string, unknown[]>> {
  const map = new Map<string, unknown[]>();
  if (parentIds.length === 0) return map;
  const mongoose = await import("mongoose");
  const ids = parentIds.map((id) => new mongoose.Types.ObjectId(id));
  const docs = await Review.find({ parentId: { $in: ids } }).sort({ createdAt: 1 }).lean();
  for (const id of parentIds) {
    map.set(id, []);
  }
  for (const d of docs) {
    const parentId = (d as { parentId: Types.ObjectId }).parentId?.toString?.();
    if (parentId) {
      const list = map.get(parentId) ?? [];
      list.push(d);
      map.set(parentId, list);
    }
  }
  return map;
}

export async function findUserReview(productId: string, userId: string) {
  const doc = await Review.findOne({ productId, userId, parentId: null }).lean();
  return doc ?? null;
}

export async function updateReview(productId: string, userId: string, data: { rating?: number; comment?: string; imageUrls?: string[] }) {
  const doc = await Review.findOneAndUpdate({ productId, userId, parentId: null }, { $set: data }, { new: true }).lean();
  return doc ?? null;
}

export async function countByProduct(productId: string): Promise<number> {
  return Review.countDocuments({ productId, parentId: null });
}

export async function getAverageRating(productId: string): Promise<number | null> {
  const mongoose = await import("mongoose");
  const result = await Review.aggregate<{ avg: number }>([
    { $match: { productId: new mongoose.Types.ObjectId(productId), parentId: null } },
    { $group: { _id: null, avg: { $avg: "$rating" } } },
  ]);
  return result[0]?.avg ?? null;
}

export async function findById(reviewId: string) {
  const doc = await Review.findById(reviewId).lean();
  return doc ?? null;
}

/** Get most recent top-level reviews across all products, for bot context. */
export async function findRecent(limit: number) {
  const docs = await Review.find({ parentId: null })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return docs;
}
