import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    label: { type: String, trim: true, maxlength: 50, default: "Shipping" },
    line1: { type: String, required: true, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    state: { type: String, trim: true, maxlength: 100 },
    zip: { type: String, trim: true, maxlength: 20 },
    country: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, trim: true, maxlength: 30 },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "addresses" }
);

addressSchema.index({ userId: 1 });

export const Address = mongoose.model("Address", addressSchema);
