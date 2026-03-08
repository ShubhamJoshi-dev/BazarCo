import mongoose, { type Types } from "mongoose";
import crypto from "crypto";
import { KycVerification, type KycStatus } from "../models/kycVerification.model";

const TOKEN_EXPIRY_HOURS = 72;

export async function findByUserId(userId: string) {
  return KycVerification.findOne({ userId }).populate("documentIds").lean();
}

export async function createOrUpdatePending(
  userId: string | Types.ObjectId,
  documentId: Types.ObjectId
) {
  const verifyToken = crypto.randomBytes(32).toString("hex");
  const verifyTokenExpires = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  const existing = await KycVerification.findOne({ userId });
  if (existing) {
    const docIds = Array.isArray(existing.documentIds) ? [...existing.documentIds] : [];
    if (!docIds.some((id) => id.toString() === documentId.toString())) {
      docIds.push(documentId);
    }
    await KycVerification.updateOne(
      { userId },
      {
        status: "pending",
        documentIds: docIds,
        verifyToken,
        verifyTokenExpires,
        verifiedAt: undefined,
        rejectionReason: undefined,
      }
    );
    return { verifyToken, verifyTokenExpires };
  }
  await KycVerification.create({
    userId,
    status: "pending",
    documentIds: [documentId],
    verifyToken,
    verifyTokenExpires,
  });
  return { verifyToken, verifyTokenExpires };
}

export async function findByVerifyToken(token: string) {
  if (!token?.trim()) return null;
  return KycVerification.findOne({
    verifyToken: token.trim(),
    verifyTokenExpires: { $gt: new Date() },
  })
    .populate("userId", "name email")
    .lean();
}

export async function setStatus(
  kycId: string,
  status: KycStatus,
  opts?: { rejectionReason?: string }
) {
  const setPayload: Record<string, unknown> = { status };
  if (status === "verified") {
    setPayload.verifiedAt = new Date();
  }
  if (status === "rejected" && opts?.rejectionReason) {
    setPayload.rejectionReason = opts.rejectionReason;
  }
  return KycVerification.findByIdAndUpdate(
    kycId,
    { $set: setPayload, $unset: { verifyToken: "", verifyTokenExpires: "" } },
    { new: true }
  );
}

export async function findByUserIdRaw(userId: string) {
  return KycVerification.findOne({ userId });
}

export async function removeDocumentId(userId: string, documentId: Types.ObjectId | string) {
  const docIdStr = typeof documentId === "string" ? documentId : documentId.toString();
  const oid = mongoose.Types.ObjectId.isValid(docIdStr) && String(new mongoose.Types.ObjectId(docIdStr)) === docIdStr
    ? new mongoose.Types.ObjectId(docIdStr)
    : docIdStr;
  await KycVerification.updateOne({ userId }, { $pull: { documentIds: oid } });
}
