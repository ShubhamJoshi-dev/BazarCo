import type { Types } from "mongoose";
import { ReviewReaction } from "../models/reviewReaction.model";

export type ReactionType = "like" | "dislike";

export async function setReaction(
  reviewId: string,
  userId: string,
  type: ReactionType
): Promise<{ likeCount: number; dislikeCount: number; userReaction: ReactionType | null }> {
  const revId = reviewId as unknown as Types.ObjectId;
  const uId = userId as unknown as Types.ObjectId;
  const existing = await ReviewReaction.findOne({ reviewId: revId, userId: uId }).lean();
  if (existing && (existing as { type: string }).type === type) {
    await ReviewReaction.deleteOne({ reviewId: revId, userId: uId });
    const counts = await getCounts(reviewId);
    return { ...counts, userReaction: null };
  }
  await ReviewReaction.findOneAndUpdate(
    { reviewId: revId, userId: uId },
    { $set: { type } },
    { upsert: true, new: true }
  );
  const counts = await getCounts(reviewId);
  const userReaction = type;
  return { ...counts, userReaction };
}

export async function getCounts(reviewId: string): Promise<{ likeCount: number; dislikeCount: number }> {
  const revId = reviewId as unknown as Types.ObjectId;
  const [likeCount, dislikeCount] = await Promise.all([
    ReviewReaction.countDocuments({ reviewId: revId, type: "like" }),
    ReviewReaction.countDocuments({ reviewId: revId, type: "dislike" }),
  ]);
  return { likeCount, dislikeCount };
}

export async function getUserReaction(reviewId: string, userId: string): Promise<ReactionType | null> {
  const doc = await ReviewReaction.findOne({
    reviewId: reviewId as unknown as Types.ObjectId,
    userId: userId as unknown as Types.ObjectId,
  }).lean();
  if (!doc) return null;
  return (doc as { type: ReactionType }).type;
}

export async function getCountsForMany(reviewIds: string[]): Promise<Map<string, { likeCount: number; dislikeCount: number }>> {
  const map = new Map<string, { likeCount: number; dislikeCount: number }>();
  if (reviewIds.length === 0) return map;
  const mongoose = await import("mongoose");
  const ids = reviewIds.map((id) => new mongoose.Types.ObjectId(id));
  const agg = await ReviewReaction.aggregate<{ _id: { reviewId: { toString(): string }; type: string }; count: number }>([
    { $match: { reviewId: { $in: ids } } },
    { $group: { _id: { reviewId: "$reviewId", type: "$type" }, count: { $sum: 1 } } },
  ]);
  for (const id of reviewIds) {
    map.set(id, { likeCount: 0, dislikeCount: 0 });
  }
  for (const row of agg) {
    const rid = row._id.reviewId.toString();
    const type = row._id.type;
    const entry = map.get(rid) ?? { likeCount: 0, dislikeCount: 0 };
    if (type === "like") entry.likeCount = row.count;
    else entry.dislikeCount = row.count;
    map.set(rid, entry);
  }
  return map;
}

export async function getUserReactionsForMany(
  reviewIds: string[],
  userId: string
): Promise<Map<string, ReactionType>> {
  const map = new Map<string, ReactionType>();
  if (reviewIds.length === 0) return map;
  const mongoose = await import("mongoose");
  const docs = await ReviewReaction.find({
    reviewId: { $in: reviewIds.map((id) => new mongoose.Types.ObjectId(id)) },
    userId: new mongoose.Types.ObjectId(userId),
  }).lean();
  for (const d of docs) {
    const r = d as { reviewId: { toString(): string }; type: ReactionType };
    map.set(r.reviewId.toString(), r.type);
  }
  return map;
}
