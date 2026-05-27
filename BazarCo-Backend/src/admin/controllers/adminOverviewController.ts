import type { Request, Response } from "express";
import { successResponse } from "../../helpers/response.helper";
import { User } from "../../models/user.model";
import { Product } from "../../models/product.model";
import { KycVerification } from "../../models/kycVerification.model";
import { SellerVideo } from "../../models/sellerVideo.model";
import { Message } from "../../models/message.model";
import { Conversation } from "../../models/conversation.model";
import { AdminAuditLog } from "../models/adminAuditLog.model";

export async function getOverview(_req: Request, res: Response): Promise<void> {
  const [
    totalUsers,
    activeSellers,
    suspendedUsers,
    deletedUsers,
    totalProducts,
    activeProducts,
    flaggedProducts,
    pendingKyc,
    totalVideos,
    flaggedMessages,
    totalConversations,
    recentAuditCount,
  ] = await Promise.all([
    User.countDocuments({ deletedAt: null }),
    User.countDocuments({ role: "seller", deletedAt: null, suspendedAt: null }),
    User.countDocuments({ suspendedAt: { $ne: null }, deletedAt: null }),
    User.countDocuments({ deletedAt: { $ne: null } }),
    Product.countDocuments({ deletedAt: null }),
    Product.countDocuments({ status: "active", deletedAt: null }),
    Product.countDocuments({ flagged: true, deletedAt: null }),
    KycVerification.countDocuments({ status: "pending" }),
    SellerVideo.countDocuments({}),
    Message.countDocuments({ flagged: true, adminDeleted: false }),
    Conversation.countDocuments({}),
    AdminAuditLog.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
  ]);

  successResponse(res, 200, "Admin overview", {
    stats: {
      totalUsers,
      activeSellers,
      suspendedUsers,
      deletedUsers,
      totalProducts,
      activeProducts,
      flaggedProducts,
      pendingKyc,
      totalVideos,
      flaggedMessages,
      totalConversations,
      recentAuditCount,
    },
  });
}
