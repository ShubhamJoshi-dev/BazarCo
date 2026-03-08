"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
  BarChart3,
  ChevronRight,
  Calendar,
  ArrowUpRight,
  FileBarChart,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { sellerReport, type SellerReport } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const DATE_RANGES = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
] as const;

export default function AnalyticsPage() {
  const { user } = useAuth();
  const isSeller = user?.role === "seller";
  const [report, setReport] = useState<SellerReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<(typeof DATE_RANGES)[number]["key"]>("30d");

  useEffect(() => {
    if (!isSeller) return;
    sellerReport()
      .then(setReport)
      .finally(() => setLoading(false));
  }, [isSeller]);

  if (!isSeller) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
        <BarChart3 className="mx-auto w-12 h-12 text-neutral-500 mb-4" />
        <p className="text-[var(--brand-white)] font-medium">Analytics is for sellers</p>
        <p className="text-sm text-neutral-400 mt-1">Sign in as a seller to view analytics.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-neutral-400 flex items-center gap-2"
        >
          <TrendingUp className="w-5 h-5" />
          Loading analytics…
        </motion.div>
      </div>
    );
  }

  const salesTotal = typeof report?.salesTotal === "number" ? report.salesTotal : 0;
  const ordersCount = (report?.ordersCompleted?.length ?? 0) + (report?.ordersInProgress?.length ?? 0);
  const soldCount = report?.soldCount ?? 0;
  const activeListings = report?.productsActive ?? 0;

  const categories = Array.isArray(report?.productsByCategory) ? report.productsByCategory : [];
  const chartData = categories.length > 0
    ? categories.slice(0, 7).map((c, i) => ({
        name: c?.categoryName ?? "Other",
        sales: typeof c?.count === "number" ? c.count * (10 + (i % 3)) : 0,
        products: typeof c?.count === "number" ? c.count : 0,
      }))
    : [
        { name: "No data", sales: 0, products: 0 },
      ];

  const metricCards = [
    {
      label: "Total sales",
      value: `$${salesTotal.toFixed(2)}`,
      icon: DollarSign,
      color: "emerald",
      href: "/dashboard/report",
    },
    {
      label: "Orders",
      value: String(ordersCount),
      icon: ShoppingBag,
      color: "blue",
      href: "/dashboard/orders",
    },
    {
      label: "Products sold",
      value: String(soldCount),
      icon: Package,
      color: "amber",
      href: "/dashboard/report",
    },
    {
      label: "Active listings",
      value: String(activeListings),
      icon: BarChart3,
      color: "violet",
      href: "/dashboard/products",
    },
  ];

  const colorMap = {
    emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    blue: "bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] border-[var(--brand-blue)]/30",
    amber: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    violet: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  };

  return (
    <div className="space-y-8">
      {/* Header: Shopify-style with date range */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-[var(--brand-white)]">Analytics</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Overview of your store performance
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1">
          <Calendar className="w-4 h-4 text-neutral-500 ml-2" />
          {DATE_RANGES.map((range) => (
            <button
              key={range.key}
              type="button"
              onClick={() => setDateRange(range.key)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                dateRange === range.key
                  ? "bg-[var(--brand-red)]/20 text-[var(--brand-red)]"
                  : "text-neutral-400 hover:text-[var(--brand-white)] hover:bg-white/5"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Top metric cards */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {metricCards.map((card, i) => {
          const Icon = card.icon;
          const colorClass = colorMap[card.color as keyof typeof colorMap];
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.03 }}
            >
              <Link
                href={card.href}
                className="block rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-white/20 hover:bg-white/[0.06] transition-all duration-200 group"
              >
                <div className="flex items-start justify-between">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-neutral-500 group-hover:text-[var(--brand-red)] transition-colors" />
                </div>
                <p className="mt-3 text-2xl font-bold text-[var(--brand-white)]">{card.value}</p>
                <p className="text-sm text-neutral-400 mt-0.5">{card.label}</p>
              </Link>
            </motion.div>
          );
        })}
      </motion.section>

      {/* Main chart */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[var(--brand-white)]">Overview</h2>
          <span className="text-xs text-neutral-500 capitalize">{DATE_RANGES.find((r) => r.key === dateRange)?.label}</span>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand-red)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--brand-red)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" tick={{ fill: "#a3a3a3", fontSize: 12 }} />
              <YAxis tick={{ fill: "#a3a3a3", fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--brand-black)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                }}
                labelStyle={{ color: "var(--brand-white)" }}
                formatter={(value: number | undefined) => [value ?? 0, "Value"]}
              />
              <Area
                type="monotone"
                dataKey="products"
                stroke="var(--brand-red)"
                strokeWidth={2}
                fill="url(#areaGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-neutral-500 mt-2 text-center">Products by category (relative)</p>
      </motion.section>

      {/* Reports CTA */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Link
          href="/dashboard/report"
          className="flex items-center justify-between rounded-2xl border border-[var(--brand-blue)]/30 bg-[var(--brand-blue)]/10 p-6 hover:border-[var(--brand-blue)]/50 hover:bg-[var(--brand-blue)]/15 transition-all duration-200 group"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-blue)]/20 text-[var(--brand-blue)]">
              <FileBarChart className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--brand-white)]">Reports</h3>
              <p className="text-sm text-neutral-400 mt-0.5">
                Detailed reports, sales by category, orders in progress, and product list
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-neutral-400 group-hover:text-[var(--brand-blue)] transition-colors shrink-0" />
        </Link>
      </motion.section>
    </div>
  );
}
