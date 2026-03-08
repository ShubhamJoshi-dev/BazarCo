import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Review", default: null },
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 2000 },
    imageUrls: { type: [String], default: [] },
  },
  { timestamps: true, collection: "reviews" }
);

// One top-level review per user per product; replies (parentId set) are not limited
reviewSchema.index(
  { productId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { parentId: null } }
);
reviewSchema.index({ productId: 1, parentId: 1 });
reviewSchema.index({ parentId: 1, createdAt: 1 });

export const Review = mongoose.model("Review", reviewSchema);
