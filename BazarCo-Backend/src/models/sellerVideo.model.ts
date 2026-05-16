import mongoose from "mongoose";

export type SellerVideoStatus = "draft" | "processing" | "live" | "categorized";

const sellerVideoSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    caption: { type: String, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ["draft", "processing", "live", "categorized"],
      default: "draft",
    },
    videoUrl: { type: String, trim: true },
    thumbnailUrl: { type: String, trim: true },
    durationSeconds: { type: Number, default: 0, min: 0 },
    fileSizeBytes: { type: Number, default: 0, min: 0 },
    visibility: { type: String, enum: ["public", "private"], default: "public" },
    category: { type: String, trim: true, maxlength: 120 },
    linkedProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    allowBargaining: { type: Boolean, default: false },
    minOfferPrice: { type: Number, default: 0, min: 0 },
    scheduledAt: { type: Date },
    publishedAt: { type: Date },
    views: { type: Number, default: 0, min: 0 },
    likes: { type: Number, default: 0, min: 0 },
    comments: { type: Number, default: 0, min: 0 },
    revenue: { type: Number, default: 0, min: 0 },
    uploadProgress: { type: Number, default: 100, min: 0, max: 100 },
  },
  { timestamps: true, collection: "seller_videos" },
);

export const SellerVideo = mongoose.model("SellerVideo", sellerVideoSchema);
