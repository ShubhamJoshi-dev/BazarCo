import type { Request, Response } from "express";
import type { Types } from "mongoose";
import { errorResponse, successResponse } from "../helpers/response.helper";
import { emailHelper } from "../helpers/email.helper";
import { env } from "../config/env";
import { logger } from "../lib/logger";
import { uploadDocument, isCloudinaryConfigured, deleteByPublicId } from "../services/cloudinary.service";
import { extractNepalNationalId, extractCompanyCard } from "../services/ocr.service";
import * as documentRepo from "../repositories/document.repository";
import * as kycRepo from "../repositories/kycVerification.repository";
import * as userRepo from "../repositories/user.repository";
import type { DocumentType, NepalIdExtractedData, CompanyCardExtractedData } from "../models/document.model";

type AuthUser = { id: string; email: string; name?: string; role: string };
type ReqWithUser = { user?: AuthUser; file?: Express.Multer.File; body: Record<string, unknown> };

export async function uploadKycDocument(
  req: ReqWithUser,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      errorResponse(res, 401, "Authentication required");
      return;
    }
    if (user.role !== "seller") {
      errorResponse(res, 403, "Only sellers can submit KYC documents");
      return;
    }

    const documentType = typeof req.body.documentType === "string"
      ? (req.body.documentType.trim().toLowerCase() as string)
      : "";
    if (documentType !== "national_card" && documentType !== "company_card") {
      errorResponse(res, 400, "documentType must be national_card or company_card");
      return;
    }

    const file = req.file;
    if (!file?.buffer) {
      errorResponse(res, 400, "Document file is required (image: JPEG, PNG, WebP, GIF, max 5MB). Make sure to select a file.");
      return;
    }

    if (!isCloudinaryConfigured()) {
      errorResponse(res, 503, "Document upload is not configured (set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)");
      return;
    }

    // For national ID, validate with OCR first; reject if not a valid Nepal national ID.
    let nationalIdExtraction: { extractedData: NepalIdExtractedData; isValidNationalId: boolean; extractionStatus: "success" | "invalid" } | null = null;
    let companyCardExtraction: { extractedData: CompanyCardExtractedData; isValidCompanyCard: boolean; extractionStatus: "success" | "invalid" } | null = null;

    if (documentType === "national_card" && file.buffer) {
      try {
        const extraction = await extractNepalNationalId(Buffer.from(file.buffer));
        if (!extraction.isValidNationalId || extraction.extractionStatus === "invalid") {
          errorResponse(
            res,
            400,
            "Please upload a valid national identity card (राष्ट्रिय परिचयपत्र). This image does not appear to be a Nepal national ID."
          );
          return;
        }
        nationalIdExtraction = extraction;
      } catch (ocrErr) {
        logger.error("KYC OCR validation failed", ocrErr);
        errorResponse(res, 500, "Document validation failed. Please try again.");
        return;
      }
    }

    if (documentType === "company_card" && file.buffer) {
      try {
        companyCardExtraction = await extractCompanyCard(Buffer.from(file.buffer));
        if (!companyCardExtraction.isValidCompanyCard || companyCardExtraction.extractionStatus === "invalid") {
          errorResponse(
            res,
            400,
            "Please upload a valid company registration card or PAN certificate. This image does not appear to be a valid business document."
          );
          return;
        }
      } catch (ocrErr) {
        logger.error("KYC company card OCR failed", ocrErr);
        errorResponse(res, 500, "Document validation failed. Please try again.");
        return;
      }
    }

    const result = await uploadDocument(file.buffer);
    if (!result) {
      errorResponse(res, 500, "Failed to upload document to storage. Check Cloudinary configuration.");
      return;
    }

  const doc = await documentRepo.createDocument({
    userId: user.id,
    documentType: documentType as DocumentType,
    fileUrl: result.url,
    publicId: result.publicId,
  });
  const docId = (doc as { _id: Types.ObjectId })._id;

  if (documentType === "national_card" && nationalIdExtraction) {
    const docIdStr = docId.toString();
    await documentRepo.updateExtraction(docIdStr, user.id, {
      extractedData: nationalIdExtraction.extractedData,
      isValidNationalId: nationalIdExtraction.isValidNationalId,
      extractionStatus: nationalIdExtraction.extractionStatus,
    });
  }

  if (documentType === "company_card" && companyCardExtraction) {
    const docIdStr = docId.toString();
    await documentRepo.updateExtraction(docIdStr, user.id, {
      extractedData: companyCardExtraction.extractedData,
      isValidNationalId: companyCardExtraction.isValidCompanyCard,
      extractionStatus: companyCardExtraction.extractionStatus,
    });
  }

  const { verifyToken, verifyTokenExpires } = await kycRepo.createOrUpdatePending(
    user.id,
    docId
  );

  const base = env.BASE_URL.replace(/\/+$/, "");
const prefix = env.API_PREFIX ? (env.API_PREFIX.startsWith("/") ? env.API_PREFIX : "/" + env.API_PREFIX.replace(/\/+$/, "")) : "";
const verifyUrl = `${base}${prefix}/kyc/verify?token=${encodeURIComponent(verifyToken)}`;

  /** KYC verification emails go only to this admin address. */
  const KYC_ADMIN_EMAIL = "shubhamrajjoshi69@gmail.com";
  if (KYC_ADMIN_EMAIL && env.APP_MAIL && env.APP_PW) {
    try {
      await emailHelper.sendEmail({
        to: KYC_ADMIN_EMAIL,
        subject: "[BazarCo] KYC document submitted for verification",
        text: `Seller ${user.name || user.email} (${user.email}) has submitted a KYC document (${documentType}).\nDocument: ${result.url}\n\nTo verify, open this link: ${verifyUrl}\n\nLink expires at ${verifyTokenExpires.toISOString()}.`,
        html: `
          <p>Seller <strong>${(user.name || user.email) as string}</strong> (${user.email}) has submitted a KYC document: <strong>${documentType}</strong>.</p>
          <p><a href="${result.url}" target="_blank">View document</a></p>
          <p><a href="${verifyUrl}" style="display:inline-block;background:#22c55e;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;">Verify KYC</a></p>
          <p style="color:#666;font-size:12px;">Link expires at ${verifyTokenExpires.toISOString()}.</p>
        `,
      });
    } catch (e) {
      logger.error("KYC notification email failed", e);
    }
  }

  successResponse(res, 201, "Document uploaded. Admin will verify your KYC.", {
    documentId: docId.toString(),
    documentType,
    status: "pending",
  });
  } catch (e) {
    logger.error("KYC upload error", e);
    errorResponse(res, 500, e instanceof Error ? e.message : "Upload failed");
  }
}

export async function verifyKyc(req: Request, res: Response): Promise<void> {
  const token = typeof req.query.token === "string" ? req.query.token.trim() : "";
  if (!token) {
    res.status(400).send(
      "<!DOCTYPE html><html><body><h1>Invalid link</h1><p>Missing or invalid verification token.</p></body></html>"
    );
    return;
  }

  const kyc = await kycRepo.findByVerifyToken(token);
  if (!kyc) {
    res.status(400).send(
      "<!DOCTYPE html><html><body><h1>Link expired or invalid</h1><p>This verification link has expired or was already used.</p></body></html>"
    );
    return;
  }

  const userId = (kyc.userId as { _id: Types.ObjectId })._id.toString();
  await kycRepo.setStatus((kyc as { _id: Types.ObjectId })._id.toString(), "verified");
  await userRepo.setKycVerified(userId, true);

  const frontendBase = (env.FRONTEND_URL || env.BASE_URL).replace(/\/+$/, "");
  const redirectUrl = `${frontendBase}/dashboard/kyc?verified=1`;
  res.redirect(302, redirectUrl);
}

export async function getKycStatus(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  if (user.role !== "seller") {
    errorResponse(res, 403, "Only sellers have KYC status");
    return;
  }

  const kyc = await kycRepo.findByUserId(user.id);
  const documents = await documentRepo.findByUserId(user.id);

  const dbUser = await userRepo.findById(user.id);
  const userKycVerified = (dbUser as { kycVerified?: boolean })?.kycVerified ?? false;
  const docList = documents as Array<{ documentType?: string; isValidNationalId?: boolean }>;
  const hasNationalCard = docList.some((d) => d.documentType === "national_card");
  const hasValidNationalId = docList.some((d) => d.documentType === "national_card" && d.isValidNationalId === true);
  // Show verified only when there are documents, admin verified, and any national ID doc is OCR-valid
  const kycVerified =
    documents.length > 0 && userKycVerified && (!hasNationalCard || hasValidNationalId);

  successResponse(res, 200, "KYC status", {
    kycVerified,
    status: kyc?.status ?? "pending",
    documents: documents.map((d: Record<string, unknown> & { _id: Types.ObjectId; documentType: string; fileUrl: string; publicId?: string; createdAt?: Date; extractedData?: unknown; isValidNationalId?: boolean; extractionStatus?: string; extractionError?: string }) => ({
      id: d._id.toString(),
      documentType: d.documentType,
      fileUrl: d.fileUrl,
      publicId: d.publicId,
      uploadedAt: d.createdAt?.toISOString?.(),
      extractedData: d.extractedData,
      isValidNationalId: d.isValidNationalId,
      extractionStatus: d.extractionStatus ?? "pending",
      extractionError: d.extractionError,
    })),
  });
}

export async function deleteKycDocument(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  if (user.role !== "seller") {
    errorResponse(res, 403, "Only sellers can manage KYC documents");
    return;
  }
  const documentId = typeof req.params.documentId === "string" ? req.params.documentId.trim() : "";
  if (!documentId) {
    errorResponse(res, 400, "Document ID required");
    return;
  }
  const doc = await documentRepo.findByIdAndUserId(documentId, user.id);
  if (!doc) {
    errorResponse(res, 404, "Document not found");
    return;
  }
  const publicId = (doc as { publicId?: string }).publicId;
  if (publicId) await deleteByPublicId(publicId);
  await kycRepo.removeDocumentId(user.id, documentId);
  await documentRepo.deleteById(documentId, user.id);

  // If no documents remain, clear verified status so UI does not show "Verified"
  const remaining = await documentRepo.findByUserId(user.id);
  if (remaining.length === 0) {
    await userRepo.setKycVerified(user.id, false);
  }

  successResponse(res, 200, "Document removed");
}
