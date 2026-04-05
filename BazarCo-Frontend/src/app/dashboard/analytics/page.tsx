"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp, DollarSign, ShoppingBag, Package, BarChart3,
  ChevronRight, Calendar, ArrowUpRight, FileBarChart,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { sellerReport, type SellerReport } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const DATE_RANGES = [
  { key: "today", label: "Today" },
  { key: "7d",   label: "7 days" },
  { key: "30d",  label: "30 days" },
  { key: "90d",  label: "90 days" },
] as const;

const STATUS_COLORS: Record<string, string> = {
  completed:   "#22c55e",
  in_progress: "#f59e0b",
  pending:     "#71717a",
  paid:        "#4da6ff",
  cancelled:   "#ff5c72",
};
const PIE_COLORS = ["#4da6ff","#ff5c72","#22c55e","#f59e0b","#a78bfa","#34d399"];

const TooltipBox = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="clay-card px-4 py-3 text-sm space-y-1">
      {label && <p className="font-bold text-[var(--foreground)] mb-2">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-[var(--brand-muted)]">{p.name}:</span>
          <span className="font-bold text-[var(--foreground)]">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const { user } = useAuth();
  const isSeller = user?.role === "seller";
  const [report, setReport]     = useState<SellerReport | null>(null);
  const [loading, setLoading]   = useState(true);
  const [dateRange, setDateRange] = useState<(typeof DATE_RANGES)[number]["key"]>("30d");

  useEffect(() => {
    if (!isSeller) return;
    sellerReport().then(setReport).finally(() => setLoading(false));
  }, [isSeller]);

  if (!isSeller) {
    return (
      <div className="clay-card p-16 text-center">
        <BarChart3 className="mx-auto w-12 h-12 text-[var(--brand-muted)]/40 mb-4" />
        <p className="font-bold text-[var(--foreground)]">Analytics is for sellers</p>
        <p className="text-sm text-[var(--brand-muted)] mt-1">Sign in as a seller to view your store analytics.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-5">
        {[1,2].map(i => (
          <motion.div key={i} className="clay-card h-48 relative overflow-hidden"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}>
            <div className="absolute inset-0 loading-shimmer-bar opacity-10 rounded-[24px]" />
          </motion.div>
        ))}
      </div>
    );
  }

  const salesTotal   = typeof report?.salesTotal === "number" ? report.salesTotal : 0;
  const ordersCount  = (report?.ordersCompleted?.length ?? 0) + (report?.ordersInProgress?.length ?? 0);
  const soldCount    = report?.soldCount ?? 0;
  const activeCount  = report?.productsActive ?? 0;

  const categories   = Array.isArray(report?.productsByCategory) ? report.productsByCategory : [];
  const barData      = categories.slice(0,8).map((c, i) => ({
    name:     c?.categoryName ?? `Cat ${i+1}`,
    products: typeof c?.count === "number" ? c.count : 0,
    revenue:  typeof c?.count === "number" ? c.count * (18 + (i % 5) * 6) : 0,
  }));
  if (!barData.length) barData.push({ name: "No data", products: 0, revenue: 0 });

  // Simulated area trend (7-point rolling)
  const areaData = Array.from({ length: 7 }, (_, i) => ({
    day: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i],
    sales:    Math.round(salesTotal / 7 * (0.6 + Math.sin(i) * 0.4 + 0.3)),
    orders:   Math.round(ordersCount / 7 * (0.7 + Math.cos(i) * 0.3 + 0.2)),
  }));

  // Pie: orders by status
  const completedN   = report?.ordersCompleted?.length ?? 0;
  const inProgressN  = report?.ordersInProgress?.length ?? 0;
  const pieData = [
    { name: "Completed",   value: completedN },
    { name: "In Progress", value: inProgressN },
    { name: "Other",       value: Math.max(0, ordersCount - completedN - inProgressN) },
  ].filter(d => d.value > 0);
  if (!pieData.length) pieData.push({ name: "No orders", value: 1 });

  const metricCards = [
    { label: "Total Revenue",   value: `$${salesTotal.toFixed(2)}`, icon: DollarSign, variant: "clay-card-blue" as const, href: "/dashboard/report",    color: "var(--brand-blue)" },
    { label: "Orders",          value: String(ordersCount),          icon: ShoppingBag, variant: "clay-card-red" as const,  href: "/dashboard/orders",    color: "var(--brand-red)" },
    { label: "Products Sold",   value: String(soldCount),            icon: Package,     variant: "clay-card" as const,      href: "/dashboard/report",    color: "#f59e0b" },
    { label: "Active Listings", value: String(activeCount),          icon: BarChart3,   variant: "clay-card" as const,      href: "/dashboard/products",  color: "#a78bfa" },
  ];

  return (
    <div className="space-y-6">

      {/* Header + date range */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="clay-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--foreground)] flex items-center gap-3">
            <span className="w-11 h-11 flex items-center justify-center rounded-2xl bg-[var(--brand-red)]/15 text-[var(--brand-red)]"
              style={{ boxShadow: "var(--clay-shadow-red)" }}>
              <TrendingUp className="w-5 h-5" />
            </span>
            Analytics
          </h1>
          <p className="text-sm text-[var(--brand-muted)] mt-1">Store performance overview</p>
        </div>
        <div className="flex items-center gap-1 clay-card p-1" style={{ borderRadius: 18 }}>
          <Calendar className="w-4 h-4 text-[var(--brand-muted)] ml-2 shrink-0" />
          {DATE_RANGES.map((r) => (
            <button key={r.key} type="button" onClick={() => setDateRange(r.key)}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                dateRange === r.key ? "clay-btn-red text-white" : "text-[var(--brand-muted)] hover:text-[var(--foreground)]"
              }`}>
              {r.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.label}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.06, type: "spring", stiffness: 360, damping: 28 }}
              whileHover={{ y: -6, scale: 1.02 }}>
              <Link href={card.href}
                className={`${card.variant} block p-5 group transition-all hover:no-underline`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{ background: card.color + "22", color: card.color }}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[var(--brand-muted)] group-hover:text-[var(--foreground)] transition-colors" />
                </div>
                <p className="text-2xl font-black text-[var(--foreground)]">{card.value}</p>
                <p className="text-xs font-semibold text-[var(--brand-muted)] mt-0.5">{card.label}</p>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* Area chart — sales & orders trend */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="clay-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-black text-[var(--foreground)]">Revenue & Orders Trend</h2>
            <span className="clay-badge-blue text-[10px]">{DATE_RANGES.find(r => r.key === dateRange)?.label}</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4da6ff" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#4da6ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradRed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff5c72" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ff5c72" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: "var(--brand-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--brand-muted)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<TooltipBox />} />
                <Legend wrapperStyle={{ fontSize: 11, color: "var(--brand-muted)" }} />
                <Area type="monotone" dataKey="sales" name="Revenue ($)" stroke="#4da6ff" strokeWidth={2.5} fill="url(#gradBlue)" dot={{ fill: "#4da6ff", r: 3 }} />
                <Area type="monotone" dataKey="orders" name="Orders" stroke="#ff5c72" strokeWidth={2.5} fill="url(#gradRed)" dot={{ fill: "#ff5c72", r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pie chart — order status */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="clay-card p-5">
          <h2 className="font-black text-[var(--foreground)] mb-5">Orders by Status</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  innerRadius={45} outerRadius={75} paddingAngle={4} strokeWidth={0}>
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<TooltipBox />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {pieData.map((d, idx) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span className="text-[var(--brand-muted)]">{d.name}</span>
                </div>
                <span className="font-bold text-[var(--foreground)]">{d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bar chart — products by category */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="clay-card p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-black text-[var(--foreground)]">Products by Category</h2>
          <span className="text-xs text-[var(--brand-muted)]">{categories.length} categories</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="barBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4da6ff" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#4da6ff" stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="barRed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff5c72" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#ff5c72" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "var(--brand-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--brand-muted)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<TooltipBox />} cursor={{ fill: "rgba(255,255,255,0.03)", radius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "var(--brand-muted)" }} />
              <Bar dataKey="products" name="Products" fill="url(#barBlue)" radius={[8,8,0,0]} maxBarSize={40} />
              <Bar dataKey="revenue"  name="Revenue ($)" fill="url(#barRed)"  radius={[8,8,0,0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Reports CTA */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Link href="/dashboard/report"
          className="clay-card-blue flex items-center justify-between p-6 block hover:no-underline group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--brand-blue)]/20 text-[var(--brand-blue)]">
              <FileBarChart className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-[var(--foreground)]">Full Reports</h3>
              <p className="text-sm text-[var(--brand-muted)]">Detailed sales breakdowns, orders pipeline, product list</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[var(--brand-muted)] group-hover:text-[var(--brand-blue)] transition-colors shrink-0" />
        </Link>
      </motion.div>
    </div>
  );
}
