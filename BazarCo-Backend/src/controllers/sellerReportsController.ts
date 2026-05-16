import type { Request, Response } from "express";
import { errorResponse, successResponse } from "../helpers/response.helper";
import type { ReportFormat, ReportGranularity, ReportType } from "../models/reportRun.model";
import * as reportsRepo from "../repositories/sellerReports.repository";

type ReqWithUser = Request & { user?: { id: string } };

const REPORT_TYPES: ReportType[] = [
  "sales_performance",
  "inventory",
  "vat_filing",
  "low_stock",
  "orders",
];
const FORMATS: ReportFormat[] = ["pdf", "excel", "csv"];
const GRANULARITIES: ReportGranularity[] = ["daily", "weekly", "monthly"];

function parseDate(v: unknown): Date | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function getHub(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "10"), 10) || 10));
  try {
    const hub = await reportsRepo.getSellerReportsHub(user.id, page, limit);
    successResponse(res, 200, "Reports hub loaded", { hub });
  } catch (err) {
    console.error("Seller reports hub error:", err);
    errorResponse(res, 500, "Failed to load reports");
  }
}

export async function generate(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const body = req.body as Record<string, unknown>;
  const reportType = body.reportType as ReportType;
  const format = body.format as ReportFormat;
  const granularity = (body.granularity as ReportGranularity) || "daily";
  const periodStart = parseDate(body.periodStart);
  const periodEnd = parseDate(body.periodEnd);

  if (!REPORT_TYPES.includes(reportType)) {
    errorResponse(res, 400, "Invalid report type");
    return;
  }
  if (!FORMATS.includes(format)) {
    errorResponse(res, 400, "Invalid format");
    return;
  }
  if (!GRANULARITIES.includes(granularity)) {
    errorResponse(res, 400, "Invalid granularity");
    return;
  }
  if (!periodStart || !periodEnd || periodEnd < periodStart) {
    errorResponse(res, 400, "Invalid date range");
    return;
  }

  try {
    const result = await reportsRepo.generateReport(user.id, {
      reportType,
      format,
      periodStart,
      periodEnd,
      granularity,
    });
    successResponse(res, 200, "Report generated", { report: result });
  } catch (err) {
    console.error("Seller report generate error:", err);
    errorResponse(res, 500, "Failed to generate report");
  }
}

export async function download(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const reportId = req.params.id;
  if (!reportId) {
    errorResponse(res, 400, "Report id required");
    return;
  }
  try {
    const file = await reportsRepo.getReportContent(user.id, reportId);
    if (!file) {
      errorResponse(res, 410, "Report expired or not found");
      return;
    }
    successResponse(res, 200, "Report ready", { file });
  } catch (err) {
    console.error("Seller report download error:", err);
    errorResponse(res, 500, "Failed to download report");
  }
}

export async function regenerate(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const reportId = req.params.id;
  if (!reportId) {
    errorResponse(res, 400, "Report id required");
    return;
  }
  try {
    const result = await reportsRepo.regenerateReport(user.id, reportId);
    if (!result) {
      errorResponse(res, 404, "Report not found");
      return;
    }
    successResponse(res, 200, "Report regenerated", { report: result });
  } catch (err) {
    console.error("Seller report regenerate error:", err);
    errorResponse(res, 500, "Failed to regenerate report");
  }
}
