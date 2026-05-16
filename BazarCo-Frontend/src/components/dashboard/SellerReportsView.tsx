"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Calendar,
  ChevronRight,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Table2,
} from "lucide-react";
import {
  sellerReportDownload,
  sellerReportGenerate,
  sellerReportRegenerate,
  sellerReportsHub,
  type SellerReportFormat,
  type SellerReportGranularity,
  type SellerReportHistoryItem,
  type SellerReportType,
  type SellerReportsHub,
} from "@/lib/api";
import { downloadReportFile } from "@/lib/reportDownload";

const FORMAT_OPTIONS: {
  id: SellerReportFormat;
  labelKey: "formatPdf" | "formatExcel" | "formatCsv";
  icon: typeof FileText;
  iconClass: string;
  selectedClass: string;
}[] = [
  {
    id: "pdf",
    labelKey: "formatPdf",
    icon: FileText,
    iconClass: "text-[var(--brand-red)]",
    selectedClass: "border-[var(--brand-red)] bg-red-50",
  },
  {
    id: "excel",
    labelKey: "formatExcel",
    icon: FileSpreadsheet,
    iconClass: "text-emerald-600",
    selectedClass: "border-emerald-500 bg-emerald-50",
  },
  {
    id: "csv",
    labelKey: "formatCsv",
    icon: Table2,
    iconClass: "text-amber-700",
    selectedClass: "border-amber-500 bg-amber-50",
  },
];

const REPORT_TYPES: {
  value: SellerReportType;
  labelKey: "typeSales" | "typeOrders" | "typeInventory" | "typeVat" | "typeLowStock";
}[] = [
  { value: "sales_performance", labelKey: "typeSales" },
  { value: "orders", labelKey: "typeOrders" },
  { value: "inventory", labelKey: "typeInventory" },
  { value: "vat_filing", labelKey: "typeVat" },
  { value: "low_stock", labelKey: "typeLowStock" },
];

const POPULAR: { type: SellerReportType; labelKey: string; icon: typeof FileText }[] = [
  { type: "sales_performance", labelKey: "popularMonthlySales", icon: FileText },
  { type: "vat_filing", labelKey: "popularVat", icon: FileSpreadsheet },
  { type: "low_stock", labelKey: "popularLowStock", icon: Table2 },
];

function defaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function formatBadge(format: SellerReportFormat): string {
  return format.toUpperCase();
}

function formatBadgeClass(format: SellerReportFormat): string {
  if (format === "pdf") return "bg-blue-100 text-blue-800";
  if (format === "excel") return "bg-emerald-100 text-emerald-800";
  return "bg-amber-100 text-amber-800";
}

function formatGenerated(iso: string): string {
  return new Date(iso).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SellerReportsView() {
  const t = useTranslations("sellerReports");
  const defaults = useMemo(() => defaultDateRange(), []);
  const [hub, setHub] = useState<SellerReportsHub | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [formatFilter, setFormatFilter] = useState<SellerReportFormat | "all">("all");
  const [reportType, setReportType] = useState<SellerReportType>("sales_performance");
  const [format, setFormat] = useState<SellerReportFormat>("pdf");
  const [granularity, setGranularity] = useState<SellerReportGranularity>("daily");
  const [periodStart, setPeriodStart] = useState(defaults.start);
  const [periodEnd, setPeriodEnd] = useState(defaults.end);
  const [scheduleHint, setScheduleHint] = useState(false);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil((hub?.totalHistory ?? 0) / pageSize));

  const load = useCallback(() => {
    setLoading(true);
    sellerReportsHub(historyPage, pageSize)
      .then(setHub)
      .finally(() => setLoading(false));
  }, [historyPage]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredHistory = useMemo(() => {
    const list = hub?.history ?? [];
    if (formatFilter === "all") return list;
    return list.filter((r) => r.format === formatFilter);
  }, [hub?.history, formatFilter]);

  async function handleGenerate() {
    setGenerating(true);
    const result = await sellerReportGenerate({
      reportType,
      format,
      periodStart,
      periodEnd,
      granularity,
    });
    setGenerating(false);
    if (result) {
      downloadReportFile(result.content, result.reportName, result.format);
      setHub((prev) =>
        prev
          ? {
              ...prev,
              totalThisMonth: prev.totalThisMonth + 1,
              history: [result.history, ...prev.history].slice(0, pageSize),
              totalHistory: prev.totalHistory + 1,
            }
          : prev,
      );
      load();
    }
  }

  async function handleDownload(row: SellerReportHistoryItem) {
    const file = await sellerReportDownload(row.id);
    if (file) downloadReportFile(file.content, file.reportName, file.format);
  }

  async function handleRegenerate(row: SellerReportHistoryItem) {
    setGenerating(true);
    const result = await sellerReportRegenerate(row.id);
    setGenerating(false);
    if (result) {
      downloadReportFile(result.content, result.reportName, result.format);
      load();
    }
  }

  function applyPopular(type: SellerReportType) {
    setReportType(type);
    document.getElementById("generate-report-card")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{t("title")}</h1>
          <p className="mt-1 text-sm text-[var(--brand-muted)]">{t("subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => setScheduleHint(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--brand-border)] bg-[var(--card-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] shadow-sm hover:bg-[var(--input-bg)] transition-colors shrink-0"
        >
          <Clock className="h-4 w-4" />
          {t("scheduleReport")}
        </button>
      </div>

      {scheduleHint && (
        <p className="text-sm text-[var(--brand-blue)] bg-blue-50 border border-blue-100 rounded-lg px-4 py-2">
          {t("scheduleComingSoon")}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div id="generate-report-card" className="lg:col-span-2 clay-card p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-5">{t("generateCustom")}</h2>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--brand-muted)] mb-2">
                {t("reportType")}
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as SellerReportType)}
                className="w-full rounded-lg border border-[var(--brand-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)]/15"
              >
                {REPORT_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--brand-muted)] mb-2">
                {t("exportFormat")}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {FORMAT_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const selected = format === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFormat(opt.id)}
                      className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all ${
                        selected ? opt.selectedClass : "border-[var(--brand-border)] bg-[var(--card-bg)] hover:border-neutral-300"
                      }`}
                    >
                      <Icon className={`h-8 w-8 ${opt.iconClass}`} strokeWidth={1.5} />
                      <span className="text-sm font-medium text-[var(--foreground)]">{t(opt.labelKey)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--brand-muted)] mb-2">
                  {t("dateFrom")}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full rounded-lg border border-[var(--brand-border)] bg-[var(--input-bg)] pl-10 pr-3 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)]/15"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--brand-muted)] mb-2">
                  {t("dateTo")}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full rounded-lg border border-[var(--brand-border)] bg-[var(--input-bg)] pl-10 pr-3 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)]/15"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--brand-muted)] mb-2">
                {t("granularity")}
              </label>
              <select
                value={granularity}
                onChange={(e) => setGranularity(e.target.value as SellerReportGranularity)}
                className="w-full rounded-lg border border-[var(--brand-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)]/15"
              >
                <option value="daily">{t("granularityDaily")}</option>
                <option value="weekly">{t("granularityWeekly")}</option>
                <option value="monthly">{t("granularityMonthly")}</option>
              </select>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={generating}
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-red)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-red)]/90 disabled:opacity-60 transition-colors"
              >
                <Download className="h-4 w-4" />
                {generating ? t("generating") : t("generateDownload")}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl bg-[var(--brand-blue)] p-5 text-white shadow-sm">
            <p className="text-sm text-white/85">{t("totalReportsLabel")}</p>
            <p className="mt-2 text-4xl font-bold tabular-nums">{hub?.totalThisMonth ?? (loading ? "—" : 0)}</p>
            <p className="mt-1 text-sm text-white/90">
              {(hub?.changePercent ?? 0) >= 0 ? "+" : ""}
              {hub?.changePercent ?? 0}% {t("vsLastMonth")}
            </p>
            <div className="mt-4 flex justify-end">
              <div className="rounded-lg bg-white/20 p-2">
                <FileText className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="clay-card p-5">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">{t("popularReports")}</h3>
            <ul className="space-y-1">
              {POPULAR.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.type}>
                    <button
                      type="button"
                      onClick={() => applyPopular(item.type)}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--input-bg)] transition-colors"
                    >
                      <Icon className="h-4 w-4 text-[var(--brand-muted)] shrink-0" />
                      <span className="flex-1 text-left">{t(item.labelKey)}</span>
                      <ChevronRight className="h-4 w-4 text-neutral-400" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      <div className="clay-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--brand-border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{t("reportHistory")}</h2>
          <div className="flex items-center gap-2">
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value as SellerReportFormat | "all")}
              className="rounded-lg border border-[var(--brand-border)] bg-[var(--input-bg)] px-2 py-1.5 text-xs text-[var(--foreground)]"
              aria-label={t("filterFormat")}
            >
              <option value="all">{t("filterAll")}</option>
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
            <button
              type="button"
              onClick={load}
              className="p-2 rounded-lg border border-[var(--brand-border)] text-neutral-500 hover:bg-[var(--input-bg)]"
              aria-label={t("refresh")}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              className="p-2 rounded-lg border border-[var(--brand-border)] text-neutral-500 hover:bg-[var(--input-bg)]"
              aria-label={t("filterFormat")}
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--brand-border)] bg-[var(--input-bg)]/50 text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
                  {t("colName")}
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
                  {t("colGenerated")}
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
                  {t("colFormat")}
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
                  {t("colPeriod")}
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
                  {t("colStatus")}
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
                  {t("colActions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && !hub ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-neutral-500">
                    {t("loading")}
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-neutral-500">
                    {t("noHistory")}
                  </td>
                </tr>
              ) : (
                filteredHistory.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--brand-border)] hover:bg-[var(--row-hover)]">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 font-medium text-[var(--foreground)]">
                        <FileText
                          className={`h-4 w-4 shrink-0 ${
                            row.format === "pdf"
                              ? "text-red-500"
                              : row.format === "excel"
                                ? "text-emerald-600"
                                : "text-amber-600"
                          }`}
                        />
                        {row.reportName}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-neutral-600 whitespace-nowrap">{formatGenerated(row.generatedOn)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${formatBadgeClass(row.format)}`}>
                        {formatBadge(row.format)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-neutral-600 whitespace-nowrap">{row.periodLabel}</td>
                    <td className="px-5 py-3.5">
                      {row.status === "ready" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          {t("statusReady")}
                        </span>
                      ) : (
                        <span className="rounded-md bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600">
                          {t("statusExpired")}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {row.status === "ready" ? (
                        <button
                          type="button"
                          onClick={() => handleDownload(row)}
                          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--brand-blue)] hover:underline"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {t("download")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={generating}
                          onClick={() => handleRegenerate(row)}
                          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--brand-red)] hover:underline disabled:opacity-50"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          {t("regenerate")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-t border-[var(--brand-border)]">
          <p className="text-xs text-neutral-500">
            {t("showing", {
              from: hub?.totalHistory ? (historyPage - 1) * pageSize + 1 : 0,
              to: Math.min(historyPage * pageSize, hub?.totalHistory ?? 0),
              total: hub?.totalHistory ?? 0,
            })}
          </p>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setHistoryPage(p)}
                className={`min-w-[2rem] h-8 rounded-md text-sm font-medium ${
                  p === historyPage
                    ? "bg-[var(--brand-red)] text-white"
                    : "text-neutral-600 hover:bg-[var(--input-bg)]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-blue-50 border border-blue-100 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Sparkles className="h-5 w-5 text-[var(--brand-red)] shrink-0 mt-0.5" />
          <p className="text-sm text-neutral-700">{t("customCta")}</p>
        </div>
        <button
          type="button"
          onClick={() => setScheduleHint(true)}
          className="shrink-0 rounded-lg bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95 transition-opacity"
        >
          {t("requestCustom")}
        </button>
      </div>
    </div>
  );
}
