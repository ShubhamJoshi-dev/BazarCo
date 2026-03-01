import type { Types } from "mongoose";
import { Like } from "../models/like.model";

export async function toggleLike(productId: string, userId: string): Promise<{ liked: boolean }> {
  const mongoose = await import("mongoose");
  const pid = new mongoose.Types.ObjectId(productId);
  const uid = new mongoose.Types.ObjectId(userId);
  const existing = await Like.findOneAndDelete({ productId: pid, userId: uid });
  if (existing) return { liked: false };
  await Like.create({ productId: pid, userId: uid });
  return { liked: true };
}

export async function isLikedByUser(productId: string, userId: string): Promise<boolean> {
  const mongoose = await import("mongoose");
  if (!/^[a-fA-F0-9]{24}$/.test(productId) || !/^[a-fA-F0-9]{24}$/.test(userId)) return false;
  const doc = await Like.findOne({
    productId: new mongoose.Types.ObjectId(productId),
    userId: new mongoose.Types.ObjectId(userId),
  });
  return !!doc;
}

export async function countByProduct(productId: string): Promise<number> {
  return Like.countDocuments({ productId });
}
