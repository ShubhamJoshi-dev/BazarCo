import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, collection: "conversations" }
);

// Only one conversation per order (orderId set). Product convos (orderId null) are not constrained by this.
conversationSchema.index(
  { orderId: 1, buyerId: 1, sellerId: 1 },
  { unique: true, partialFilterExpression: { orderId: { $ne: null } } }
);
conversationSchema.index({ productId: 1, buyerId: 1, sellerId: 1 }, { unique: true, sparse: true });
// One conversation per user pair when not tied to order/product (unified chat per user).
conversationSchema.index(
  { buyerId: 1, sellerId: 1 },
  { unique: true, partialFilterExpression: { orderId: null, productId: null } }
);
conversationSchema.index({ buyerId: 1, updatedAt: -1 });
conversationSchema.index({ sellerId: 1, updatedAt: -1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);
