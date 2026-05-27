import type { Request, Response } from "express";
import type { Types } from "mongoose";
import { errorResponse, successResponse } from "../helpers/response.helper";

type ReqWithUser = Request & { user?: { id: string; role?: string } };
import * as videoRepo from "../repositories/sellerVideo.repository";
import { uploadVideo, isCloudinaryConfigured } from "../services/cloudinary.service";
import { saveVideoLocally } from "../helpers/videoStorage.helper";
import type { SellerVideoStatus } from "../models/sellerVideo.model";
import { isSellerKycVerified } from "../lib/sellerKyc";

function toDto(doc: Record<string, unknown> & { _id: Types.ObjectId }) {
  return {
    id: doc._id.toString(),
    title: String(doc.title ?? ""),
    caption: String(doc.caption ?? ""),
    status: String(doc.status ?? "draft") as SellerVideoStatus,
    videoUrl: String(doc.videoUrl ?? ""),
    thumbnailUrl: String(doc.thumbnailUrl ?? ""),
    durationSeconds: Number(doc.durationSeconds ?? 0),
    fileSizeBytes: Number(doc.fileSizeBytes ?? 0),
    visibility: String(doc.visibility ?? "public"),
    category: String(doc.category ?? ""),
    linkedProductIds: Array.isArray(doc.linkedProductIds)
      ? (doc.linkedProductIds as Types.ObjectId[]).map((id) => id.toString())
      : [],
    allowBargaining: Boolean(doc.allowBargaining),
    minOfferPrice: Number(doc.minOfferPrice ?? 0),
    scheduledAt: doc.scheduledAt ? new Date(doc.scheduledAt as string).toISOString() : null,
    publishedAt: doc.publishedAt ? new Date(doc.publishedAt as string).toISOString() : null,
    views: Number(doc.views ?? 0),
    likes: Number(doc.likes ?? 0),
    comments: Number(doc.comments ?? 0),
    revenue: Number(doc.revenue ?? 0),
    uploadProgress: Number(doc.uploadProgress ?? 100),
    createdAt: doc.createdAt ? new Date(doc.createdAt as string).toISOString() : null,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt as string).toISOString() : null,
  };
}

export async function listVideos(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const status =
    typeof req.query.status === "string" &&
    ["draft", "processing", "live", "categorized"].includes(req.query.status)
      ? (req.query.status as SellerVideoStatus)
      : undefined;
  const q = typeof req.query.q === "string" ? req.query.q : undefined;
  const rows = await videoRepo.findBySeller(user.id, { status, q });
  successResponse(res, 200, "Videos listed", { videos: rows.map((r) => toDto(r as never)) });
}

export async function getInsights(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const data = await videoRepo.insightsForSeller(user.id);
  successResponse(res, 200, "Video insights", {
    summary: {
      totalViews: data.totalViews,
      watchTimeHours: Math.round(data.totalViews / 120),
      conversionRate: data.videos.some((v) => v.status === "live" || v.status === "categorized")
        ? 3.82
        : 0,
      engagementRate: Math.min(100, Math.round(data.engagement)),
      totalRevenue: data.totalRevenue,
    },
    videos: data.videos.map((r) => toDto(r as never)),
    topByRevenue: data.topByRevenue.map((r) => ({
      videoId: (r as { _id: Types.ObjectId })._id.toString(),
      title: String((r as { title?: string }).title ?? ""),
      revenue: Number((r as { revenue?: number }).revenue ?? 0),
    })),
  });
}

export async function getVideo(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const doc = await videoRepo.findByIdForSeller(req.params.id, user.id);
  if (!doc) {
    errorResponse(res, 404, "Video not found");
    return;
  }
  successResponse(res, 200, "Video", { video: toDto(doc as never) });
}

export async function uploadVideoHandler(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const file = req.file;
  if (!file?.buffer) {
    errorResponse(res, 400, "No video file uploaded");
    return;
  }
  const title =
    typeof req.body?.title === "string" && req.body.title.trim()
      ? req.body.title.trim()
      : file.originalname?.replace(/\.[^.]+$/, "") || "Untitled video";

  let videoUrl: string | null = null;
  let thumbnailUrl = "";

  if (isCloudinaryConfigured()) {
    const uploaded = await uploadVideo(file.buffer);
    if (uploaded) {
      videoUrl = uploaded.url;
      thumbnailUrl = uploaded.thumbnailUrl ?? "";
    }
  }
  if (!videoUrl) {
    videoUrl = saveVideoLocally(file.buffer, file.originalname || "video.mp4");
  }
  if (!videoUrl) {
    errorResponse(
      res,
      503,
      "Video upload is not configured. Set Cloudinary credentials or ensure local uploads are writable.",
    );
    return;
  }

  const doc = await videoRepo.createVideo({
    sellerId: user.id,
    title,
    status: "draft",
    videoUrl,
    thumbnailUrl,
    fileSizeBytes: file.size,
    uploadProgress: 100,
  });

  successResponse(res, 201, "Video uploaded", { video: toDto(doc) });
}

export async function patchVideo(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const body = req.body as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  if (typeof body.title === "string") patch.title = body.title.trim().slice(0, 200);
  if (typeof body.caption === "string") patch.caption = body.caption.slice(0, 2000);
  if (typeof body.status === "string") {
    const next = body.status as SellerVideoStatus;
    if (next === "live" || next === "categorized") {
      const kycVerified = await isSellerKycVerified(user.id);
      if (!kycVerified) {
        errorResponse(res, 403, "Complete KYC verification before making videos public.");
        return;
      }
    }
    patch.status = next;
  }
  if (typeof body.visibility === "string") patch.visibility = body.visibility;
  if (typeof body.category === "string") patch.category = body.category.slice(0, 120);
  if (Array.isArray(body.linkedProductIds)) {
    patch.linkedProductIds = body.linkedProductIds.filter((id) => typeof id === "string").slice(0, 20);
  }
  if (typeof body.allowBargaining === "boolean") patch.allowBargaining = body.allowBargaining;
  if (typeof body.minOfferPrice === "number") patch.minOfferPrice = body.minOfferPrice;
  if (body.scheduledAt === null) patch.scheduledAt = null;
  else if (typeof body.scheduledAt === "string" && body.scheduledAt) {
    patch.scheduledAt = new Date(body.scheduledAt);
  }

  const updated = await videoRepo.updateVideo(req.params.id, user.id, patch);
  if (!updated) {
    errorResponse(res, 404, "Video not found");
    return;
  }
  successResponse(res, 200, "Video updated", { video: toDto(updated as never) });
}

export async function publishVideo(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }

  const kycVerified = await isSellerKycVerified(user.id);
  if (!kycVerified) {
    errorResponse(
      res,
      403,
      "Complete KYC verification before publishing videos. Your video stays in draft until verified."
    );
    return;
  }

  const body = req.body as Record<string, unknown>;
  const patch: Record<string, unknown> = {
    status: "live",
    publishedAt: new Date(),
  };
  if (typeof body.caption === "string") patch.caption = body.caption;
  if (typeof body.visibility === "string") patch.visibility = body.visibility;
  if (typeof body.category === "string") patch.category = body.category;
  if (Array.isArray(body.linkedProductIds)) patch.linkedProductIds = body.linkedProductIds;
  if (typeof body.allowBargaining === "boolean") patch.allowBargaining = body.allowBargaining;
  if (typeof body.minOfferPrice === "number") patch.minOfferPrice = body.minOfferPrice;
  if (typeof body.scheduledAt === "string" && body.scheduledAt) {
    patch.scheduledAt = new Date(body.scheduledAt);
    patch.status = "processing";
  }

  const updated = await videoRepo.updateVideo(req.params.id, user.id, patch);
  if (!updated) {
    errorResponse(res, 404, "Video not found");
    return;
  }
  successResponse(res, 200, "Video published", { video: toDto(updated as never) });
}

export async function deleteVideoHandler(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const ok = await videoRepo.deleteVideo(req.params.id, user.id);
  if (!ok) {
    errorResponse(res, 404, "Video not found");
    return;
  }
  successResponse(res, 200, "Video deleted", {});
}
