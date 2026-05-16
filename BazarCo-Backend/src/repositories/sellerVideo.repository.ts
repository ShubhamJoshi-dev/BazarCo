import type { Types } from "mongoose";
import { SellerVideo, type SellerVideoStatus } from "../models/sellerVideo.model";

function sellerObjectId(sellerId: string) {
  const mongoose = require("mongoose") as typeof import("mongoose");
  return /^[a-fA-F0-9]{24}$/.test(sellerId)
    ? new mongoose.Types.ObjectId(sellerId)
    : sellerId;
}

export async function createVideo(data: {
  sellerId: string;
  title: string;
  status?: SellerVideoStatus;
  videoUrl?: string;
  thumbnailUrl?: string;
  fileSizeBytes?: number;
  uploadProgress?: number;
}) {
  const doc = await SellerVideo.create({
    sellerId: sellerObjectId(data.sellerId),
    title: data.title,
    status: data.status ?? "processing",
    videoUrl: data.videoUrl ?? "",
    thumbnailUrl: data.thumbnailUrl ?? "",
    fileSizeBytes: data.fileSizeBytes ?? 0,
    uploadProgress: data.uploadProgress ?? 100,
  });
  return doc.toObject() as Record<string, unknown> & { _id: Types.ObjectId };
}

export async function findByIdForSeller(id: string, sellerId: string) {
  return SellerVideo.findOne({ _id: id, sellerId: sellerObjectId(sellerId) }).lean();
}

export async function findBySeller(
  sellerId: string,
  opts?: { status?: SellerVideoStatus; q?: string },
) {
  const query: Record<string, unknown> = { sellerId: sellerObjectId(sellerId) };
  if (opts?.status) query.status = opts.status;
  if (opts?.q?.trim()) {
    query.title = { $regex: opts.q.trim(), $options: "i" };
  }
  return SellerVideo.find(query).sort({ updatedAt: -1 }).lean();
}

export async function updateVideo(
  id: string,
  sellerId: string,
  patch: Record<string, unknown>,
) {
  return SellerVideo.findOneAndUpdate(
    { _id: id, sellerId: sellerObjectId(sellerId) },
    { $set: patch },
    { new: true },
  ).lean();
}

export async function deleteVideo(id: string, sellerId: string) {
  const r = await SellerVideo.deleteOne({ _id: id, sellerId: sellerObjectId(sellerId) });
  return r.deletedCount > 0;
}

export async function findPublicFeed(opts?: {
  productId?: string;
  limit?: number;
  skip?: number;
}) {
  const mongoose = require("mongoose") as typeof import("mongoose");
  const query: Record<string, unknown> = {
    status: { $in: ["live", "categorized"] },
    visibility: "public",
    videoUrl: { $exists: true, $nin: ["", null] },
  };
  if (opts?.productId && /^[a-fA-F0-9]{24}$/.test(opts.productId)) {
    query.linkedProductIds = new mongoose.Types.ObjectId(opts.productId);
  }
  const limit = Math.min(Math.max(opts?.limit ?? 30, 1), 50);
  const skip = Math.max(opts?.skip ?? 0, 0);
  return SellerVideo.find(query)
    .sort({ publishedAt: -1, updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("sellerId", "name email")
    .populate("linkedProductIds", "name price imageUrl sellerId")
    .lean();
}

export async function incrementViews(id: string) {
  await SellerVideo.updateOne({ _id: id }, { $inc: { views: 1 } });
}

export async function insightsForSeller(sellerId: string) {
  const videos = await findBySeller(sellerId);
  const totalViews = videos.reduce((s, v) => s + (Number(v.views) || 0), 0);
  const totalRevenue = videos.reduce((s, v) => s + (Number(v.revenue) || 0), 0);
  const live = videos.filter((v) => v.status === "live" || v.status === "categorized");
  const engagement =
    live.length > 0
      ? live.reduce((s, v) => s + (Number(v.likes) || 0) + (Number(v.comments) || 0), 0) /
        live.length
      : 0;
  const topByRevenue = [...videos]
    .sort((a, b) => (Number(b.revenue) || 0) - (Number(a.revenue) || 0))
    .slice(0, 5);
  return { videos, totalViews, totalRevenue, engagement, topByRevenue };
}
