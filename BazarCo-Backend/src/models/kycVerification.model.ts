import mongoose from "mongoose";

export type KycStatus = "pending" | "verified" | "rejected";

const kycVerificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
    documentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Document" }],
    verifyToken: { type: String, trim: true },
    verifyTokenExpires: { type: Date },
    verifiedAt: { type: Date },
    rejectionReason: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true, collection: "kyc_verifications" }
);

kycVerificationSchema.index({ verifyToken: 1 }, { sparse: true });

export const KycVerification = mongoose.model("KycVerification", kycVerificationSchema);
