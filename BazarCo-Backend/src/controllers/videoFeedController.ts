import type { Request, Response } from "express";
import type { Types } from "mongoose";
import { errorResponse, successResponse } from "../helpers/response.helper";
import * as videoRepo from "../repositories/sellerVideo.repository";

type ReqWithUser = Request & { user?: { id: string; role?: string } };

function productFromLinked(linked: unknown) {
  if (!Array.isArray(linked) || linked.length === 0) return null;
  const p = linked[0] as Record<string, unknown> & { _id?: Types.ObjectId };
  if (!p?._id) return null;
  return {
    id: p._id.toString(),
    name: String(p.name ?? ""),
    price: Number(p.price ?? 0),
    imageUrl: p.imageUrl ? String(p.imageUrl) : "",
  };
}

function sellerFromDoc(sellerId: unknown) {
  if (!sellerId || typeof sellerId !== "object") return { name: "" };
  const s = sellerId as Record<string, unknown> & { _id?: Types.ObjectId };
  const name = String(s.name ?? "").trim();
  const email = String(s.email ?? "");
  return { name: name || email.split("@")[0] || "Seller" };
}

function toFeedDto(doc: Record<string, unknown> & { _id: Types.ObjectId }) {
  const linked = doc.linkedProductIds;
  const seller = sellerFromDoc(doc.sellerId);
  return {
    id: doc._id.toString(),
    title: String(doc.title ?? ""),
    caption: String(doc.caption ?? ""),
    videoUrl: String(doc.videoUrl ?? ""),
    thumbnailUrl: String(doc.thumbnailUrl ?? ""),
    durationSeconds: Number(doc.durationSeconds ?? 0),
    views: Number(doc.views ?? 0),
    likes: Number(doc.likes ?? 0),
    comments: Number(doc.comments ?? 0),
    allowBargaining: Boolean(doc.allowBargaining),
    minOfferPrice: Number(doc.minOfferPrice ?? 0),
    linkedProductIds: Array.isArray(linked)
      ? (linked as { _id?: Types.ObjectId }[])
          .filter((p) => p?._id)
          .map((p) => p._id!.toString())
      : [],
    product: productFromLinked(linked),
    sellerName: seller.name,
    publishedAt: doc.publishedAt ? new Date(doc.publishedAt as string).toISOString() : null,
  };
}

export async function listVideoFeed(req: ReqWithUser, res: Response): Promise<void> {
  if (!req.user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const productId = typeof req.query.productId === "string" ? req.query.productId : undefined;
  const limit = typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : 30;
  const skip = typeof req.query.skip === "string" ? parseInt(req.query.skip, 10) : 0;
  const rows = await videoRepo.findPublicFeed({ productId, limit, skip });
  successResponse(res, 200, "Video feed", {
    videos: rows.map((r) => toFeedDto(r as never)),
  });
}

export async function recordVideoView(req: ReqWithUser, res: Response): Promise<void> {
  if (!req.user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const id = req.params.id;
  if (!id) {
    errorResponse(res, 400, "Video id required");
    return;
  }
  await videoRepo.incrementViews(id);
  successResponse(res, 200, "View recorded", {});
}
