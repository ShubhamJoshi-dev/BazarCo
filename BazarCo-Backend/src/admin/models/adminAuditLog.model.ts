import mongoose from "mongoose";

const adminAuditLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", required: true },
    adminUsername: { type: String, trim: true },
    action: { type: String, required: true, trim: true, maxlength: 128 },
    resource: { type: String, trim: true, maxlength: 64 },
    resourceId: { type: String, trim: true, maxlength: 128 },
    method: { type: String, trim: true, maxlength: 16 },
    path: { type: String, trim: true, maxlength: 256 },
    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true, maxlength: 512 },
    metadata: { type: mongoose.Schema.Types.Mixed },
    success: { type: Boolean, default: true },
    errorMessage: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true, collection: "admin_audit_logs" }
);

adminAuditLogSchema.index({ adminId: 1, createdAt: -1 });
adminAuditLogSchema.index({ action: 1, createdAt: -1 });
adminAuditLogSchema.index({ resource: 1, resourceId: 1, createdAt: -1 });

export const AdminAuditLog = mongoose.model("AdminAuditLog", adminAuditLogSchema);
