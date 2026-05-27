import mongoose from "mongoose";
import type { AdminRole } from "../constants/roles";

const adminUserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 64 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false },
    name: { type: String, trim: true, maxlength: 120 },
    role: {
      type: String,
      enum: ["super_admin", "admin", "moderator", "support"],
      default: "admin",
    },
    extraPermissions: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
    lastLoginAt: { type: Date },
    tokenVersion: { type: Number, default: 0 },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    loginHistory: [
      {
        ip: { type: String, trim: true },
        userAgent: { type: String, trim: true, maxlength: 512 },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true, collection: "admin_users" }
);

adminUserSchema.index({ role: 1, isActive: 1 });
adminUserSchema.index({ deletedAt: 1 });

export type AdminUserDoc = mongoose.InferSchemaType<typeof adminUserSchema> & {
  _id: mongoose.Types.ObjectId;
  role: AdminRole;
};

export const AdminUser = mongoose.model("AdminUser", adminUserSchema);
