import mongoose from "mongoose";

export type ProductStatus = "draft" | "active" | "archived";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5000 },
    price: { type: Number, required: true, min: 0 },
    sku: { type: String, trim: true, maxlength: 64 },
    stock: { type: Number, default: 0, min: 0 },
    brand: { type: String, trim: true, maxlength: 120 },
    imageUrl: { type: String, trim: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    tagIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
    status: { type: String, enum: ["draft", "active", "archived"], default: "draft" },
    shopifyProductId: { type: String, trim: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date, default: null },
    flagged: { type: Boolean, default: false },
    flagReason: { type: String, trim: true, maxlength: 500 },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "products" }
);

productSchema.index({ deletedAt: 1 });
productSchema.index({ flagged: 1 });
productSchema.index({ featured: 1 });

export const Product = mongoose.model("Product", productSchema);
