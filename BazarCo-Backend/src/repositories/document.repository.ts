import type { Types } from "mongoose";
import { Document, type DocumentType, type NepalIdExtractedData } from "../models/document.model";

export async function createDocument(data: {
  userId: string | Types.ObjectId;
  documentType: DocumentType;
  fileUrl: string;
  publicId?: string;
}) {
  const doc = await Document.create({
    userId: data.userId,
    documentType: data.documentType,
    fileUrl: data.fileUrl,
    publicId: data.publicId,
  });
  return doc.toObject();
}

export async function findByUserId(userId: string) {
  return Document.find({ userId }).sort({ createdAt: -1 }).lean();
}

export async function findByIdAndUserId(documentId: string, userId: string) {
  const doc = await Document.findOne({ _id: documentId, userId }).lean();
  return doc ?? null;
}

export async function deleteById(documentId: string, userId: string) {
  const result = await Document.findOneAndDelete({ _id: documentId, userId });
  return result != null;
}

export async function updateExtraction(
  documentId: string,
  userId: string,
  data: {
    extractedData?: NepalIdExtractedData;
    isValidNationalId?: boolean;
    extractionStatus: "pending" | "success" | "failed" | "invalid";
    extractionError?: string;
  }
) {
  const result = await Document.findOneAndUpdate(
    { _id: documentId, userId },
    { $set: data },
    { new: true }
  ).lean();
  return result;
}
