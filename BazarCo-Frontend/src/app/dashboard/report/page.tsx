"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Package,
  TrendingUp,
  Star,
  ShoppingBag,
  Archive,
  PieChart as PieChartIcon,
  List,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { sellerReport, type SellerReport } from "@/lib/api";

const CHART_COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#8b5cf6", "#ec4899"];

export default function ReportPage() {
  const [report, setReport] = useState<SellerReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sellerReport()
      .then(setReport)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-neutral-400"
        >
          Loading report…
        </motion.div>
      </div>
    );
  }

  if (!report) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center"
      >
        <BarChart3 className="mx-auto w-12 h-12 text-neutral-500 mb-4" />
        <p className="text-[var(--brand-white)] font-medium">Could not load report</p>
        <p className="text-sm text-neutral-400 mt-1">Sign in and try again.</p>
      </motion.div>
    );
  }

  const categories = Array.isArray(report.productsByCategory) ? report.productsByCategory : [];
  const pieData = categories.map((c, i) => ({
    name: c?.categoryName ?? "Uncategorized",
    value: typeof c?.count === "number" ? c.count : 0,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
  const barData = categories.map((c, i) => ({
    name: c?.categoryName ?? "Uncategorized",
    products: typeof c?.count === "number" ? c.count : 0,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <h1 className="text-2xl font-bold text-[var(--brand-white)]">Report & analysis</h1>
      </motion.div>

      {/* Rating & overview cards */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
            <Star className="h-6 w-6" fill="currentColor" />
          </div>
          <div>
            <p className="text-sm text-neutral-400">Seller rating</p>
            <p className="text-2xl font-bold text-[var(--brand-white)]">
              {(report.ratingCount ?? 0) > 0 ? Number(report.rating ?? 0).toFixed(1) : "—"}
            </p>
            <p className="text-xs text-neutral-500">{report.ratingCount ?? 0} review{(report.ratingCount ?? 0) !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-blue)]/20 text-[var(--brand-blue)]">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-neutral-400">Total products</p>
            <p className="text-2xl font-bold text-[var(--brand-white)]">{report.productsTotal ?? 0}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-neutral-400">Active listings</p>
            <p className="text-2xl font-bold text-[var(--brand-white)]">{report.productsActive ?? 0}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-red)]/20 text-[var(--brand-red)]">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-neutral-400">Total sales</p>
            <p className="text-2xl font-bold text-[var(--brand-white)]">
              ${typeof report.salesTotal === "number" ? report.salesTotal.toFixed(2) : "0.00"}
            </p>
          </div>
        </div>
      </motion.section>

      {/* Archived */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex items-center gap-4 max-w-xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-500/20 text-neutral-400">
            <Archive className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-neutral-400">Archived</p>
            <p className="text-xl font-bold text-[var(--brand-white)]">{report.productsArchived ?? 0}</p>
          </div>
        </div>
      </motion.section>

      {/* Product list */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.09 }}
        className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--brand-white)] mb-4">
          <List className="w-5 h-5 text-[var(--brand-blue)]" />
          Your product list
        </h2>
        {report.productList && report.productList.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="px-4 py-3 font-medium text-neutral-400">Product name</th>
                  <th className="px-4 py-3 font-medium text-neutral-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {report.productList.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="px-4 py-3 text-[var(--brand-white)]">{p.name}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-neutral-500/20 text-neutral-400"}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-neutral-500 py-6">No products yet. Add products from the Products page.</p>
        )}
      </motion.section>

      {/* Products sold */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--brand-white)] mb-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          Products sold
          {(report.soldCount ?? 0) > 0 && (
            <span className="text-sm font-normal text-neutral-400">({report.soldCount} items)</span>
          )}
        </h2>
        {report.productsSold && report.productsSold.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="px-4 py-3 font-medium text-neutral-400">Product name</th>
                  <th className="px-4 py-3 font-medium text-neutral-400">Qty</th>
                  <th className="px-4 py-3 font-medium text-neutral-400">Order ID</th>
                </tr>
              </thead>
              <tbody>
                {report.productsSold.map((item, i) => (
                  <tr key={`${item.orderId}-${i}`} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="px-4 py-3 text-[var(--brand-white)]">{item.productName}</td>
                    <td className="px-4 py-3 text-neutral-300">{item.quantity}</td>
                    <td className="px-4 py-3 text-neutral-500 font-mono text-xs">{item.orderId.slice(-8)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-neutral-500 py-6">No sales yet. Completed orders will appear here.</p>
        )}
      </motion.section>

      {/* Orders in progress */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.11 }}
        className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--brand-white)] mb-4">
          <Clock className="w-5 h-5 text-amber-500" />
          Orders in progress
          {report.ordersInProgress && report.ordersInProgress.length > 0 && (
            <span className="text-sm font-normal text-neutral-400">({report.ordersInProgress.length} orders)</span>
          )}
        </h2>
        {report.ordersInProgress && report.ordersInProgress.length > 0 ? (
          <div className="space-y-4">
            {report.ordersInProgress.map((order) => (
              <div key={order.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className="text-xs text-neutral-500 font-mono">Order #{order.id.slice(-8)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${order.status === "in_progress" ? "bg-amber-500/20 text-amber-400" : "bg-[var(--brand-blue)]/20 text-[var(--brand-blue)]"}`}>
                    {order.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-sm text-neutral-400 mb-2">Total: ${order.total.toFixed(2)}</p>
                <ul className="text-sm text-[var(--brand-white)] space-y-1">
                  {order.items.map((item, i) => (
                    <li key={i}>{item.productName} × {item.quantity} — ${(item.price * item.quantity).toFixed(2)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-neutral-500 py-6">No orders in progress. Pending or in-progress orders will appear here.</p>
        )}
      </motion.section>

      {/* Charts */}
      <div className="grid gap-8 lg:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
        >
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--brand-white)] mb-6">
            <PieChartIcon className="w-5 h-5 text-[var(--brand-red)]" />
            Products by category
          </h2>
          {pieData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={pieData[i].color} stroke="rgba(0,0,0,0.2)" strokeWidth={1} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--brand-black)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                    labelStyle={{ color: "var(--brand-white)" }}
                    formatter={(value: number | undefined) => [value ?? 0, "Products"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-neutral-500 text-center py-12">No category data yet. Add products with categories.</p>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
        >
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--brand-white)] mb-6">
            <BarChart3 className="w-5 h-5 text-[var(--brand-blue)]" />
            Category breakdown
          </h2>
          {barData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: "#a3a3a3", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#a3a3a3", fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--brand-black)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                    formatter={(value: number | undefined) => [value ?? 0, "Products"]}
                    labelStyle={{ color: "var(--brand-white)" }}
                  />
                  <Legend />
                  <Bar dataKey="products" name="Products" radius={[6, 6, 0, 0]}>
                    {barData.map((_, i) => (
                      <Cell key={i} fill={barData[i].fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-neutral-500 text-center py-12">No category data yet. Add products with categories.</p>
          )}
        </motion.section>
      </div>
    </div>
  );
}
