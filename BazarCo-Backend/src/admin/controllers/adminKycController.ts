import type { Request, Response } from "express";
import { errorResponse, successResponse } from "../../helpers/response.helper";
import { KycVerification } from "../../models/kycVerification.model";
import { Document } from "../../models/document.model";
import { User } from "../../models/user.model";
import { parsePagination, paginationMeta } from "../lib/pagination";
import type { AdminAuthUser } from "../middleware/requireAdminAuth.middleware";
import { logAdminAction } from "../services/audit.service";
import * as userRepo from "../../repositories/user.repository";

export async function listKyc(req: Request, res: Response): Promise<void> {
  const { page, limit, sort, order, skip } = parsePagination(req.query as Record<string, unknown>);
  const filter: Record<string, unknown> = {};
  if (req.query.status === "pending" || req.query.status === "verified" || req.query.status === "rejected") {
    filter.status = req.query.status;
  }
  const [items, total] = await Promise.all([
    KycVerification.find(filter).sort({ [sort]: order }).skip(skip).limit(limit).populate("userId", "email name role").lean(),
    KycVerification.countDocuments(filter),
  ]);
  successResponse(res, 200, "KYC submissions", {
    submissions: items.map((k) => ({
      id: String(k._id),
      userId: String(k.userId?._id ?? k.userId),
      user: k.userId && typeof k.userId === "object" ? k.userId : undefined,
      status: k.status,
      verifiedAt: k.verifiedAt,
      rejectionReason: k.rejectionReason,
      createdAt: k.createdAt,
      updatedAt: k.updatedAt,
    })),
    pagination: paginationMeta(total, page, limit),
  });
}

export async function getKycDetail(req: Request, res: Response): Promise<void> {
  const kyc = await KycVerification.findById(req.params.id).lean();
  if (!kyc) {
    errorResponse(res, 404, "KYC record not found");
    return;
  }
  const docs = await Document.find({ _id: { $in: kyc.documentIds ?? [] } }).lean();
  const user = await User.findById(kyc.userId).select("email name role kycVerified").lean();
  successResponse(res, 200, "KYC detail", {
    submission: {
      id: String(kyc._id),
      userId: String(kyc.userId),
      status: kyc.status,
      verifiedAt: kyc.verifiedAt,
      rejectionReason: kyc.rejectionReason,
      user,
      documents: docs.map((d) => ({
        id: String(d._id),
        documentType: d.documentType,
        fileUrl: d.fileUrl,
        publicId: d.publicId,
        createdAt: d.createdAt,
      })),
      history: { createdAt: kyc.createdAt, updatedAt: kyc.updatedAt },
    },
  });
}

export async function approveKyc(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { admin: AdminAuthUser }).admin;
  const kyc = await KycVerification.findById(req.params.id);
  if (!kyc) {
    errorResponse(res, 404, "KYC record not found");
    return;
  }
  kyc.status = "verified";
  kyc.verifiedAt = new Date();
  kyc.rejectionReason = undefined;
  await kyc.save();
  await userRepo.setKycVerified(kyc.userId.toString(), true);
  await logAdminAction({ adminId: admin.id, adminUsername: admin.username, action: "kyc.approve", resource: "kyc", resourceId: req.params.id });
  successResponse(res, 200, "KYC approved");
}

export async function rejectKyc(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { admin: AdminAuthUser }).admin;
  const note = typeof req.body.rejectionReason === "string" ? req.body.rejectionReason.trim().slice(0, 500) : "Rejected by admin";
  const kyc = await KycVerification.findByIdAndUpdate(
    req.params.id,
    { $set: { status: "rejected", rejectionReason: note, verifiedAt: undefined } },
    { new: true }
  );
  if (!kyc) {
    errorResponse(res, 404, "KYC record not found");
    return;
  }
  await userRepo.setKycVerified(kyc.userId.toString(), false);
  await logAdminAction({ adminId: admin.id, adminUsername: admin.username, action: "kyc.reject", resource: "kyc", resourceId: req.params.id, metadata: { note } });
  successResponse(res, 200, "KYC rejected", { rejectionReason: note });
}
