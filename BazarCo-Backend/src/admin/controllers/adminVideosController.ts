import type { Request, Response } from "express";
import { errorResponse, successResponse } from "../../helpers/response.helper";
import { SellerVideo } from "../../models/sellerVideo.model";
import { parsePagination, paginationMeta } from "../lib/pagination";
import type { AdminAuthUser } from "../middleware/requireAdminAuth.middleware";
import { logAdminAction } from "../services/audit.service";

function serialize(v: Record<string, unknown>) {
  return {
    id: String(v._id),
    title: v.title,
    caption: v.caption,
    status: v.status,
    sellerId: String(v.sellerId),
    videoUrl: v.videoUrl,
    thumbnailUrl: v.thumbnailUrl,
    durationSeconds: v.durationSeconds,
    views: v.views,
    likes: v.likes,
    comments: v.comments,
    category: v.category,
    visibility: v.visibility,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  };
}

export async function getVideo(req: Request, res: Response): Promise<void> {
  const video = await SellerVideo.findById(req.params.id).lean();
  if (!video) {
    errorResponse(res, 404, "Video not found");
    return;
  }
  successResponse(res, 200, "Video", { video: serialize(video as Record<string, unknown>) });
}

export async function listVideos(req: Request, res: Response): Promise<void> {
  const { page, limit, sort, order, skip } = parsePagination(req.query as Record<string, unknown>);
  const filter: Record<string, unknown> = {};
  if (typeof req.query.status === "string") filter.status = req.query.status;
  if (typeof req.query.sellerId === "string") filter.sellerId = req.query.sellerId;
  if (typeof req.query.q === "string" && req.query.q.trim()) {
    filter.title = new RegExp(req.query.q.trim(), "i");
  }
  const [items, total] = await Promise.all([
    SellerVideo.find(filter).sort({ [sort]: order }).skip(skip).limit(limit).lean(),
    SellerVideo.countDocuments(filter),
  ]);
  successResponse(res, 200, "Videos", {
    videos: items.map((v) => serialize(v as Record<string, unknown>)),
    pagination: paginationMeta(total, page, limit),
  });
}

export async function deleteVideo(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { admin: AdminAuthUser }).admin;
  if (req.body.confirm !== true && req.body.confirm !== "true") {
    errorResponse(res, 400, "Confirmation required (confirm: true)");
    return;
  }
  const deleted = await SellerVideo.findByIdAndDelete(req.params.id);
  if (!deleted) {
    errorResponse(res, 404, "Video not found");
    return;
  }
  await logAdminAction({ adminId: admin.id, adminUsername: admin.username, action: "video.delete", resource: "video", resourceId: req.params.id });
  successResponse(res, 200, "Video deleted");
}

export async function bulkDeleteVideos(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { admin: AdminAuthUser }).admin;
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  if (!ids.length || (req.body.confirm !== true && req.body.confirm !== "true")) {
    errorResponse(res, 400, "ids and confirm:true required");
    return;
  }
  const result = await SellerVideo.deleteMany({ _id: { $in: ids } });
  await logAdminAction({ adminId: admin.id, adminUsername: admin.username, action: "video.bulk_delete", metadata: { count: result.deletedCount } });
  successResponse(res, 200, "Videos deleted", { deleted: result.deletedCount });
}

export async function disableSellerVideos(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { admin: AdminAuthUser }).admin;
  const sellerId = typeof req.body.sellerId === "string" ? req.body.sellerId : req.params.sellerId;
  if (!sellerId) {
    errorResponse(res, 400, "sellerId required");
    return;
  }
  const result = await SellerVideo.updateMany({ sellerId }, { $set: { status: "draft" } });
  await logAdminAction({ adminId: admin.id, adminUsername: admin.username, action: "video.disable_seller", resource: "seller", resourceId: sellerId, metadata: { modified: result.modifiedCount } });
  successResponse(res, 200, "Seller videos disabled", { modified: result.modifiedCount });
}

export async function updateVideoStatus(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { admin: AdminAuthUser }).admin;
  const status = req.body.status;
  if (!["draft", "processing", "live", "categorized"].includes(status)) {
    errorResponse(res, 400, "Invalid status");
    return;
  }
  const video = await SellerVideo.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true }).lean();
  if (!video) {
    errorResponse(res, 404, "Video not found");
    return;
  }
  await logAdminAction({ adminId: admin.id, adminUsername: admin.username, action: "video.status", resource: "video", resourceId: req.params.id, metadata: { status } });
  successResponse(res, 200, "Video status updated", { video: serialize(video as Record<string, unknown>) });
}
