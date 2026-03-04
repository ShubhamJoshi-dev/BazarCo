import type { Types } from "mongoose";
import { Review } from "../models/review.model";

export async function createReview(data: {
  productId: string | Types.ObjectId;
  userId: string | Types.ObjectId;
  rating: number;
  comment?: string;
}) {
  const doc = await Review.create(data);
  return doc.toObject();
}

export async function findByProduct(productId: string, limit = 50) {
  const docs = await Review.find({ productId }).sort({ createdAt: -1 }).limit(limit).lean();
  return docs;
}

export async function findUserReview(productId: string, userId: string) {
  const doc = await Review.findOne({ productId, userId }).lean();
  return doc ?? null;
}

export async function updateReview(productId: string, userId: string, data: { rating?: number; comment?: string }) {
  const doc = await Review.findOneAndUpdate({ productId, userId }, { $set: data }, { new: true }).lean();
  return doc ?? null;
}

export async function countByProduct(productId: string): Promise<number> {
  return Review.countDocuments({ productId });
}
export async function ReviewfindById(id: string | Types.ObjectId) {
    return Review.findById(id);
  }

export async function getAverageRating(productId: string): Promise<number | null> {
  const mongoose = await import("mongoose");
  const result = await Review.aggregate<{ avg: number }>([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: null, avg: { $avg: "$rating" } } },
  ]);
  return result[0]?.avg ?? null;
}
