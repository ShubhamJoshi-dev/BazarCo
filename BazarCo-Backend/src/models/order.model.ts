import mongoose from "mongoose";

export type OrderStatus = "pending" | "paid" | "in_progress" | "completed" | "cancelled";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    zip: { type: String, trim: true },
    country: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "paid", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
    stripeSessionId: { type: String, trim: true },
    shippingAddress: shippingAddressSchema,
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: "Rider" },
    urgent: { type: Boolean, default: false },
    shopifyOrderId:{type:String}
  },
  { timestamps: true, collection: "orders" }
);

export const Order = mongoose.model("Order", orderSchema);
