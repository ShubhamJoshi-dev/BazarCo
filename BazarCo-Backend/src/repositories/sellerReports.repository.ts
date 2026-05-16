import type { Types } from "mongoose";
import {
  ReportRun,
  type ReportFormat,
  type ReportGranularity,
  type ReportRunStatus,
  type ReportType,
} from "../models/reportRun.model";
import { Order } from "../models/order.model";
import { Product } from "../models/product.model";

export interface ReportHistoryItem {
  id: string;
  reportName: string;
  reportType: ReportType;
  generatedOn: string;
  format: ReportFormat;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  granularity: ReportGranularity;
  status: ReportRunStatus;
}

export interface SellerReportsHub {
  totalThisMonth: number;
  changePercent: number;
  history: ReportHistoryItem[];
  totalHistory: number;
}

const REPORT_NAMES: Record<ReportType, string> = {
  sales_performance: "Sales Performance",
  inventory: "Inventory Summary",
  vat_filing: "VAT Filing",
  low_stock: "Low Stock Alert",
  orders: "Order Summary",
};

function periodLabel(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

function escapeCsv(v: string | number): string {
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [headers.map(escapeCsv).join(",")];
  for (const row of rows) lines.push(row.map(escapeCsv).join(","));
  return lines.join("\n");
}

function wrapPdfLikeCsv(title: string, csv: string): string {
  return `${title}\nGenerated: ${new Date().toISOString()}\n\n${csv}`;
}

async function buildReportContent(
  sellerId: string,
  reportType: ReportType,
  format: ReportFormat,
  periodStart: Date,
  periodEnd: Date,
  granularity: ReportGranularity,
): Promise<{ reportName: string; content: string }> {
  const reportName = REPORT_NAMES[reportType];
  const rangeEnd = new Date(periodEnd);
  rangeEnd.setHours(23, 59, 59, 999);

  if (reportType === "inventory" || reportType === "low_stock") {
    const products = await Product.find({ sellerId }).lean();
    const filtered =
      reportType === "low_stock"
        ? products.filter((p) => (p as { status?: string }).status === "archived")
        : products;
    const headers = ["Product", "Status", "Price", "Category"];
    const rows = filtered.map((p) => {
      const doc = p as Record<string, unknown> & {
        name: string;
        status?: string;
        price?: number;
        category?: string;
      };
      return [
        doc.name,
        doc.status ?? "active",
        doc.price ?? 0,
        (doc.category as string) ?? "",
      ];
    });
    const csv = rowsToCsv(headers, rows);
    const content =
      format === "pdf" ? wrapPdfLikeCsv(reportName, csv) : format === "excel" ? `\ufeff${csv}` : csv;
    return { reportName, content };
  }

  const orders = await Order.find({
    sellerId,
    createdAt: { $gte: periodStart, $lte: rangeEnd },
  })
    .sort({ createdAt: -1 })
    .lean();

  if (reportType === "vat_filing") {
    const completed = orders.filter((o) => (o as { status: string }).status === "completed");
    const total = completed.reduce((s, o) => s + ((o as { total: number }).total ?? 0), 0);
    const csv = rowsToCsv(
      ["Metric", "Value"],
      [
        ["Completed orders", completed.length],
        ["Gross sales (AUD)", total.toFixed(2)],
        ["Period", periodLabel(periodStart, periodEnd)],
        ["Granularity", granularity],
      ],
    );
    const content =
      format === "pdf" ? wrapPdfLikeCsv(reportName, csv) : format === "excel" ? `\ufeff${csv}` : csv;
    return { reportName, content };
  }

  const headers = ["Order ID", "Date", "Status", "Total", "Items"];
  const rows = orders.map((o) => {
    const doc = o as Record<string, unknown> & {
      _id: Types.ObjectId;
      createdAt: Date;
      status: string;
      total: number;
      items: Array<{ productName: string; quantity: number }>;
    };
    const items = (doc.items ?? [])
      .map((i) => `${i.productName} x${i.quantity}`)
      .join("; ");
    return [
      doc._id.toString().slice(-8).toUpperCase(),
      new Date(doc.createdAt).toISOString().slice(0, 10),
      doc.status,
      doc.total.toFixed(2),
      items,
    ];
  });

  if (reportType === "sales_performance" && granularity !== "daily") {
    const bucketKey = (d: Date) => {
      if (granularity === "weekly") {
        const copy = new Date(d);
        const day = copy.getDay();
        const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
        copy.setDate(diff);
        return copy.toISOString().slice(0, 10);
      }
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    };
    const buckets = new Map<string, { sales: number; orders: number }>();
    for (const o of orders) {
      const doc = o as { createdAt: Date; total: number; status: string };
      if (doc.status !== "completed") continue;
      const key = bucketKey(new Date(doc.createdAt));
      const b = buckets.get(key) ?? { sales: 0, orders: 0 };
      b.sales += doc.total;
      b.orders += 1;
      buckets.set(key, b);
    }
    const aggHeaders = ["Period", "Completed orders", "Sales (AUD)"];
    const aggRows = [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => [k, v.orders, v.sales.toFixed(2)]);
    const csv = rowsToCsv(aggHeaders, aggRows);
    const content =
      format === "pdf" ? wrapPdfLikeCsv(reportName, csv) : format === "excel" ? `\ufeff${csv}` : csv;
    return { reportName, content };
  }

  const csv = rowsToCsv(headers, rows);
  const content =
    format === "pdf" ? wrapPdfLikeCsv(reportName, csv) : format === "excel" ? `\ufeff${csv}` : csv;
  return { reportName, content };
}

function docToHistory(doc: Record<string, unknown> & {
  _id: Types.ObjectId;
  reportName: string;
  reportType: ReportType;
  format: ReportFormat;
  periodStart: Date;
  periodEnd: Date;
  granularity: ReportGranularity;
  status: ReportRunStatus;
  expiresAt: Date;
  createdAt: Date;
}): ReportHistoryItem {
  const now = new Date();
  const status: ReportRunStatus =
    doc.status === "expired" || doc.expiresAt < now ? "expired" : "ready";
  return {
    id: doc._id.toString(),
    reportName: doc.reportName,
    reportType: doc.reportType,
    generatedOn: new Date(doc.createdAt).toISOString(),
    format: doc.format,
    periodLabel: periodLabel(new Date(doc.periodStart), new Date(doc.periodEnd)),
    periodStart: new Date(doc.periodStart).toISOString(),
    periodEnd: new Date(doc.periodEnd).toISOString(),
    granularity: doc.granularity,
    status,
  };
}

export async function getSellerReportsHub(
  sellerId: string,
  page = 1,
  limit = 10,
): Promise<SellerReportsHub> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const [thisMonth, lastMonth, totalHistory, docs] = await Promise.all([
    ReportRun.countDocuments({ sellerId, createdAt: { $gte: monthStart } }),
    ReportRun.countDocuments({
      sellerId,
      createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd },
    }),
    ReportRun.countDocuments({ sellerId }),
    ReportRun.find({ sellerId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  const changePercent =
    lastMonth > 0
      ? Math.round(((thisMonth - lastMonth) / lastMonth) * 1000) / 10
      : thisMonth > 0
        ? 100
        : 0;

  await ReportRun.updateMany(
    { sellerId, expiresAt: { $lt: now }, status: "ready" },
    { $set: { status: "expired" } },
  );

  return {
    totalThisMonth: thisMonth,
    changePercent,
    history: docs.map((d) => docToHistory(d as Parameters<typeof docToHistory>[0])),
    totalHistory,
  };
}

export async function generateReport(
  sellerId: string,
  input: {
    reportType: ReportType;
    format: ReportFormat;
    periodStart: Date;
    periodEnd: Date;
    granularity: ReportGranularity;
  },
): Promise<{ id: string; reportName: string; content: string; format: ReportFormat; history: ReportHistoryItem }> {
  const { reportName, content } = await buildReportContent(
    sellerId,
    input.reportType,
    input.format,
    input.periodStart,
    input.periodEnd,
    input.granularity,
  );

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const doc = await ReportRun.create({
    sellerId,
    reportName,
    reportType: input.reportType,
    format: input.format,
    granularity: input.granularity,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    content,
    expiresAt,
    status: "ready",
  });

  const history = docToHistory(doc.toObject() as Parameters<typeof docToHistory>[0]);
  return {
    id: doc._id.toString(),
    reportName,
    content,
    format: input.format,
    history,
  };
}

export async function getReportContent(
  sellerId: string,
  reportId: string,
): Promise<{ content: string; format: ReportFormat; reportName: string } | null> {
  const doc = await ReportRun.findOne({ _id: reportId, sellerId }).lean();
  if (!doc) return null;
  const d = doc as Record<string, unknown> & {
    content: string;
    format: ReportFormat;
    reportName: string;
    expiresAt: Date;
    status: ReportRunStatus;
  };
  if (d.expiresAt < new Date() || d.status === "expired") return null;
  return { content: d.content, format: d.format, reportName: d.reportName };
}

export async function regenerateReport(
  sellerId: string,
  reportId: string,
): Promise<{ id: string; reportName: string; content: string; format: ReportFormat } | null> {
  const existing = await ReportRun.findOne({ _id: reportId, sellerId }).lean();
  if (!existing) return null;
  const e = existing as Record<string, unknown> & {
    reportType: ReportType;
    format: ReportFormat;
    periodStart: Date;
    periodEnd: Date;
    granularity: ReportGranularity;
  };
  const result = await generateReport(sellerId, {
    reportType: e.reportType,
    format: e.format,
    periodStart: new Date(e.periodStart),
    periodEnd: new Date(e.periodEnd),
    granularity: e.granularity,
  });
  return result;
}
