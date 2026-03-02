import mongoose from "mongoose";

export type OfferStatus = "pending" | "accepted" | "rejected" | "countered";

const offerSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    proposedPrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "countered"],
      default: "pending",
    },
    buyerMessage: { type: String, trim: true, maxlength: 500 },
    sellerMessage: { type: String, trim: true, maxlength: 500 },
    counterPrice: { type: Number, min: 0 },
    counterMessage: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true, collection: "offers" }
);

export const Offer = mongoose.model("Offer", offerSchema);
