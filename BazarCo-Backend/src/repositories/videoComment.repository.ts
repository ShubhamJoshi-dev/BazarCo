import type { Types } from "mongoose";
import { VideoComment } from "../models/videoComment.model";
import { SellerVideo } from "../models/sellerVideo.model";

function toObjectId(id: string) {
  const mongoose = require("mongoose") as typeof import("mongoose");
  return /^[a-fA-F0-9]{24}$/.test(id) ? new mongoose.Types.ObjectId(id) : id;
}

export async function createComment(data: {
  videoId: string;
  userId: string;
  text: string;
  parentId?: string | null;
}) {
  const doc = await VideoComment.create({
    videoId: toObjectId(data.videoId),
    userId: toObjectId(data.userId),
    text: data.text,
    parentId: data.parentId ? toObjectId(data.parentId) : null,
  });
  await SellerVideo.updateOne({ _id: data.videoId }, { $inc: { comments: 1 } });
  return doc.toObject() as Record<string, unknown> & {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    parentId?: Types.ObjectId | null;
    text: string;
    createdAt: Date;
  };
}

export async function findRootByVideo(videoId: string, limit = 50) {
  return VideoComment.find({ videoId: toObjectId(videoId), parentId: null })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

export async function findRepliesByParentIds(parentIds: string[]) {
  const map = new Map<string, Record<string, unknown>[]>();
  if (parentIds.length === 0) return map;
  const mongoose = await import("mongoose");
  const ids = parentIds.map((id) => new mongoose.Types.ObjectId(id));
  const docs = await VideoComment.find({ parentId: { $in: ids } })
    .sort({ createdAt: 1 })
    .lean();
  for (const id of parentIds) map.set(id, []);
  for (const d of docs) {
    const pid = (d as { parentId: Types.ObjectId }).parentId?.toString?.();
    if (pid) {
      const list = map.get(pid) ?? [];
      list.push(d as Record<string, unknown>);
      map.set(pid, list);
    }
  }
  return map;
}

export async function findById(commentId: string) {
  return VideoComment.findById(commentId).lean();
}

export async function countByVideo(videoId: string) {
  return VideoComment.countDocuments({ videoId: toObjectId(videoId) });
}

export async function syncVideoCommentCount(videoId: string) {
  const count = await countByVideo(videoId);
  await SellerVideo.updateOne({ _id: videoId }, { $set: { comments: count } });
  return count;
}
