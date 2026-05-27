import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false },
    name: { type: String, trim: true, maxlength: 100 },
    role: { type: String, enum: ["buyer", "seller", "rider"], default: "buyer" },
    kycVerified: { type: Boolean, default: false },
    shopActive: { type: Boolean, default: true },
    shopTagline: { type: String, trim: true, maxlength: 80, default: "SHOP SAFE WORK" },
    shopDisplayName: { type: String, trim: true, maxlength: 120 },
    businessName: { type: String, trim: true, maxlength: 200 },
    panVat: { type: String, trim: true, maxlength: 64 },
    businessAddress: { type: String, trim: true, maxlength: 500 },
    phone: { type: String, trim: true, maxlength: 32 },
    locationLabel: { type: String, trim: true, maxlength: 200 },
    shopLogoUrl: { type: String, trim: true },
    notifyOrderUpdates: { type: Boolean, default: true },
    notifyInventoryAlerts: { type: Boolean, default: true },
    notifyMarketing: { type: Boolean, default: false },
    shippingStandardHub: { type: Boolean, default: true },
    shippingDoorstep: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    emailVerified: { type: Boolean, default: true },
    suspendedAt: { type: Date, default: null },
    suspendedReason: { type: String, trim: true, maxlength: 500 },
    deletedAt: { type: Date, default: null },
    messagingBanned: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: { type: Date },
    loginHistory: [
      {
        ip: { type: String, trim: true },
        userAgent: { type: String, trim: true, maxlength: 512 },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true, collection: "users" }
);

userSchema.index({ deletedAt: 1 });
userSchema.index({ suspendedAt: 1 });
userSchema.index({ role: 1, createdAt: -1 });

export const User = mongoose.model("User", userSchema);
