import mongoose from "mongoose";

export type ReportFormat = "pdf" | "excel" | "csv";
export type ReportType =
  | "sales_performance"
  | "inventory"
  | "vat_filing"
  | "low_stock"
  | "orders";
export type ReportGranularity = "daily" | "weekly" | "monthly";
export type ReportRunStatus = "ready" | "expired";

const reportRunSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reportName: { type: String, required: true, trim: true, maxlength: 200 },
    reportType: {
      type: String,
      enum: ["sales_performance", "inventory", "vat_filing", "low_stock", "orders"],
      required: true,
    },
    format: { type: String, enum: ["pdf", "excel", "csv"], required: true },
    granularity: { type: String, enum: ["daily", "weekly", "monthly"], default: "daily" },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    status: { type: String, enum: ["ready", "expired"], default: "ready" },
    content: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, collection: "report_runs" }
);

reportRunSchema.index({ sellerId: 1, createdAt: -1 });

export const ReportRun = mongoose.model("ReportRun", reportRunSchema);
