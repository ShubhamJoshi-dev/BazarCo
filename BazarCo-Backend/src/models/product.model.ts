import mongoose from "mongoose";

export type ProductStatus = "active" | "archived";

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
    status: { type: String, enum: ["active", "archived"], default: "active" },
    shopifyProductId: { type: String, trim: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, collection: "products" }
);

export const Product = mongoose.model("Product", productSchema);
