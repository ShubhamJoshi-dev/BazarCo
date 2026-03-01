import mongoose from "mongoose";

const favouriteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  },
  { timestamps: true, collection: "favourites" }
);

favouriteSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const Favourite = mongoose.model("Favourite", favouriteSchema);
