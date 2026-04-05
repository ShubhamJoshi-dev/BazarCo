import mongoose from "mongoose";

export type DocumentType = "national_card" | "company_card";

/** Nepal national ID extracted fields (Nepali labels + values) */
export interface NepalIdExtractedData {
  नाम?: string;
  name?: string;
  जन्म_मिति?: string;
  dateOfBirth?: string;
  नागरिकता_नम्बर?: string;
  citizenshipNumber?: string;
  जिल्ला?: string;
  district?: string;
  पिताको_नाम?: string;
  fatherName?: string;
  आमाको_नाम?: string;
  motherName?: string;
  ठेगाना?: string;
  address?: string;
  लिङ्ग?: string;
  gender?: string;
  rawText?: string;
}

/** Company registration card / PAN card extracted fields */
export interface CompanyCardExtractedData {
  companyName?: string;
  registrationNumber?: string;
  panNumber?: string;
  vatNumber?: string;
  companyType?: string;
  address?: string;
  registeredDate?: string;
  contactPhone?: string;
  contactEmail?: string;
  ownerName?: string;
  rawText?: string;
}

const documentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    documentType: { type: String, enum: ["national_card", "company_card"], required: true },
    fileUrl: { type: String, required: true },
    publicId: { type: String, trim: true },
    extractedData: { type: mongoose.Schema.Types.Mixed },
    isValidNationalId: { type: Boolean },
    extractionStatus: { type: String, enum: ["pending", "success", "failed", "invalid"], default: "pending" },
    extractionError: { type: String, trim: true },
  },
  { timestamps: true, collection: "documents" }
);

documentSchema.index({ userId: 1, documentType: 1 });

export const Document = mongoose.model("Document", documentSchema);
