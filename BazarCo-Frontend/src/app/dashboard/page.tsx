"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  User, ShoppingCart, Flame, TrendingUp, ImageIcon, ChevronRight,
  ShieldCheck, LayoutGrid, BarChart3, FileBarChart, DollarSign,
  Package, HandCoins, MessageCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { browseProducts, sellerReport, type SellerReport } from "@/lib/api";
import type { Product } from "@/types/api";

const SECTION_STAGGER = 0.05;
const CARD_STAGGER = 0.04;

export default function DashboardPage() {
  const { user } = useAuth();
  const t = useTranslations("dashboard");
  const { formatPrice } = useCurrency();
  const isSeller = user?.role === "seller";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [sellerReportData, setSellerReportData] = useState<SellerReport | null>(null);

  useEffect(() => {
    if (isSeller) return;
    setLoading(true);
    browseProducts({ limit: 16 })
      .then((res) => setProducts(res.products))
      .finally(() => setLoading(false));
  }, [isSeller]);

  useEffect(() => {
    if (!isSeller) return;
    sellerReport().then(setSellerReportData);
  }, [isSeller]);

  const hotSales = products.slice(0, 8);
  const bestSelling = products.slice(8, 16);

  return (
    <div className="space-y-6">

      {/* Compact animated greeting bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center gap-3 px-1"
      >
        <motion.span
          animate={{ rotate: [0, 18, -10, 18, 0] }}
          transition={{ duration: 1.2, delay: 0.5, ease: "easeInOut" }}
          className="text-2xl select-none"
          style={{ display: "inline-block", transformOrigin: "70% 80%" }}
        >
          👋
        </motion.span>
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <span className="text-lg font-bold text-[var(--foreground)]">
            {isSeller ? t("welcomeSeller") : t("welcomeBack")}
            {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </span>
          <span className="ml-2 text-sm text-[var(--brand-muted)]">
            {isSeller ? t("subtitleSeller") : t("subtitleBuyer")}
          </span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 20 }}
          className="ml-auto shrink-0"
        >
          <span className={`clay-badge-${isSeller ? "red" : "blue"} flex items-center gap-1.5`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {isSeller ? "Seller" : "Buyer"}
          </span>
        </motion.div>
      </motion.div>

      {/* Feature highlight cards */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="grid gap-4 sm:grid-cols-2"
      >
        <motion.div
          whileHover={{ y: -5, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 380, damping: 24 }}
        >
          <div className="clay-card-blue p-5 h-full">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                <ShieldCheck className="h-6 w-6" strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--foreground)] mb-1">{t("verifiedSellers")}</h3>
                <p className="text-sm text-[var(--brand-muted)] leading-relaxed">
                  {t("verifiedSellersDesc")}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 380, damping: 24 }}
        >
          <div className="clay-card-red p-5 h-full">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-red)]/20 text-[var(--brand-red)]">
                <LayoutGrid className="h-6 w-6" strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--foreground)] mb-1">{t("catalogManagement")}</h3>
                <p className="text-sm text-[var(--brand-muted)] leading-relaxed">
                  {isSeller ? t("catalogDescSeller") : t("catalogDescBuyer")}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* Seller analytics stats */}
      {isSeller && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-base font-bold text-[var(--foreground)]">
              <BarChart3 className="w-5 h-5 text-[var(--brand-red)]" />
              Analytics
            </h3>
            <Link
              href="/dashboard/analytics"
              className="text-sm font-semibold text-[var(--brand-blue)] hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                href: "/dashboard/analytics",
                icon: <DollarSign className="h-5 w-5" />,
                iconBg: "bg-emerald-500/20 text-emerald-400",
                value: formatPrice(typeof sellerReportData?.salesTotal === "number" ? sellerReportData.salesTotal : 0),
                label: "Total sales",
                variant: "clay-card" as const,
              },
              {
                href: "/dashboard/orders",
                icon: <ShoppingCart className="h-5 w-5" />,
                iconBg: "bg-[var(--brand-blue)]/20 text-[var(--brand-blue)]",
                value: (sellerReportData?.ordersCompleted?.length ?? 0) + (sellerReportData?.ordersInProgress?.length ?? 0),
                label: "Orders",
                variant: "clay-card-blue" as const,
              },
              {
                href: "/dashboard/analytics",
                icon: <Package className="h-5 w-5" />,
                iconBg: "bg-amber-500/20 text-amber-400",
                value: sellerReportData?.soldCount ?? 0,
                label: "Sold",
                variant: "clay-card" as const,
              },
              {
                href: "/dashboard/report",
                icon: <FileBarChart className="h-5 w-5" />,
                iconBg: "bg-violet-500/20 text-violet-400",
                value: sellerReportData?.productsActive ?? 0,
                label: "Active listings",
                variant: "clay-card-red" as const,
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Link href={stat.href} className={`${stat.variant} flex items-center gap-3 p-4 block`}>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.iconBg}`}>
                    {stat.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-[var(--foreground)]">{stat.value}</p>
                    <p className="text-xs text-[var(--brand-muted)]">{stat.label}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          <p className="text-sm text-[var(--brand-muted)]">
            Full data in{" "}
            <Link href="/dashboard/analytics" className="text-[var(--brand-blue)] hover:underline font-medium">Analytics</Link>
            {" "}and{" "}
            <Link href="/dashboard/report" className="text-[var(--brand-blue)] hover:underline font-medium">Reports</Link>.
          </p>
        </motion.section>
      )}

      {/* Buyer product sections */}
      {!isSeller && (
        <>
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-bold text-[var(--foreground)]">
                <Flame className="w-5 h-5 text-[var(--brand-red)]" /> Hot sales
              </h3>
              <Link href="/dashboard/browse" className="text-sm font-semibold text-[var(--brand-blue)] hover:underline flex items-center gap-1">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0.3 }} animate={{ opacity: 0.6 }}
                    transition={{ repeat: Infinity, duration: 1.2, repeatType: "reverse" }}
                    className="clay-card aspect-[3/4] overflow-hidden relative"
                  >
                    <div className="absolute inset-0 loading-shimmer-bar opacity-20 rounded-3xl" />
                  </motion.div>
                ))}
              </div>
            ) : hotSales.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {hotSales.map((p, i) => (
                  <DashboardProductCard key={p.id} product={p} index={i} delay={SECTION_STAGGER + i * CARD_STAGGER} />
                ))}
              </div>
            ) : (
              <div className="clay-card px-4 py-8 text-center">
                <p className="text-sm text-[var(--brand-muted)]">{t("noHotProducts")}</p>
              </div>
            )}
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-bold text-[var(--foreground)]">
                <TrendingUp className="w-5 h-5 text-[var(--brand-blue)]" /> {t("bestSelling")}
              </h3>
              <Link href="/dashboard/browse" className="text-sm font-semibold text-[var(--brand-blue)] hover:underline flex items-center gap-1">
                {t("viewAll")} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0.3 }} animate={{ opacity: 0.6 }}
                    transition={{ repeat: Infinity, duration: 1.2, repeatType: "reverse" }}
                    className="clay-card aspect-[3/4] overflow-hidden relative"
                  >
                    <div className="absolute inset-0 loading-shimmer-bar opacity-20 rounded-3xl" />
                  </motion.div>
                ))}
              </div>
            ) : bestSelling.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {bestSelling.map((p, i) => (
                  <DashboardProductCard key={p.id} product={p} index={i} delay={SECTION_STAGGER + i * CARD_STAGGER} />
                ))}
              </div>
            ) : (
              <div className="clay-card px-4 py-8 text-center">
                <p className="text-sm text-[var(--brand-muted)]">{t("noBestSellers")}</p>
              </div>
            )}
          </motion.section>
        </>
      )}

      {/* Quick action clay cards */}
      <div className={`grid gap-4 ${isSeller ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -5, scale: 1.01, transition: { type: "spring", stiffness: 380, damping: 24 } }}
        >
          <Link
            href={isSeller ? "/dashboard/products" : "/dashboard/browse"}
            className="clay-card-red block p-5 hover:no-underline"
          >
            <div className="w-12 h-12 mb-3 flex items-center justify-center rounded-2xl bg-[var(--brand-red)]/20 text-[var(--brand-red)]">
              <ShoppingCart className="w-6 h-6" strokeWidth={2} />
            </div>
            <p className="font-bold text-[var(--foreground)] mb-1">
              {isSeller ? t("listings") : t("myOrders")}
            </p>
            <p className="text-sm text-[var(--brand-muted)]">
              {isSeller ? t("manageProducts") : t("browseAndBuy")}
            </p>
          </Link>
        </motion.div>

        {isSeller && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            whileHover={{ y: -5, scale: 1.01 }}
          >
            <Link href="/dashboard/offers" className="clay-card block p-5 border-amber-500/20 hover:no-underline" style={{ boxShadow: "0 10px 40px -6px rgba(245,158,11,0.25), 0 4px 12px rgba(245,158,11,0.12), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
              <div className="w-12 h-12 mb-3 flex items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
                <HandCoins className="w-6 h-6" strokeWidth={2} />
              </div>
              <p className="font-bold text-[var(--foreground)] mb-1">Offers</p>
              <p className="text-sm text-[var(--brand-muted)]">Incoming offers · Chat & negotiate</p>
            </Link>
          </motion.div>
        )}

        {isSeller && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            whileHover={{ y: -5, scale: 1.01 }}
          >
            <Link href="/dashboard/chat" className="clay-card block p-5 border-emerald-500/20 hover:no-underline" style={{ boxShadow: "0 10px 40px -6px rgba(16,185,129,0.25), 0 4px 12px rgba(16,185,129,0.12), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
              <div className="w-12 h-12 mb-3 flex items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                <MessageCircle className="w-6 h-6" strokeWidth={2} />
              </div>
              <p className="font-bold text-[var(--foreground)] mb-1">Chat</p>
              <p className="text-sm text-[var(--brand-muted)]">Conversations with buyers</p>
            </Link>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -5, scale: 1.01 }}
        >
          <Link href="/dashboard/profile" className="clay-card-blue block p-5 hover:no-underline">
            <div className="w-12 h-12 mb-3 flex items-center justify-center rounded-2xl bg-[var(--brand-blue)]/20 text-[var(--brand-blue)]">
              <User className="w-6 h-6" strokeWidth={2} />
            </div>
            <p className="font-bold text-[var(--foreground)] mb-1">{t("profileSettings")}</p>
            <p className="text-sm text-[var(--brand-muted)]">{t("profileSettingsDesc")}</p>
          </Link>
        </motion.div>
      </div>

      {/* Signed-in status bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="clay-card px-5 py-4 flex flex-wrap items-center gap-3"
      >
        <span className="text-sm text-[var(--brand-muted)]">Signed in as</span>
        <span className="text-sm font-semibold text-[var(--foreground)]">{user?.email}</span>
        <span className={isSeller ? "clay-badge-red" : "clay-badge-blue"}>{user?.role}</span>
      </motion.div>
    </div>
  );
}

function DashboardProductCard({ product, index, delay }: { product: Product; index: number; delay: number }) {
  const { formatPrice } = useCurrency();
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 380, damping: 28 }}
      whileHover={{ y: -7, scale: 1.03, transition: { type: "spring", stiffness: 380, damping: 24 } }}
    >
      <Link
        href={`/dashboard/product/${product.id}`}
        className="clay-card block overflow-hidden hover:no-underline group"
        style={{ padding: 0 }}
      >
        <div className="aspect-square bg-[var(--brand-border)] relative overflow-hidden rounded-t-[24px]">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-108"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[var(--brand-muted)]">
              <ImageIcon className="w-12 h-12" />
            </div>
          )}
          {product.category && (
            <span className="absolute top-2 left-2 clay-badge-blue text-[10px]">{product.category}</span>
          )}
        </div>
        <div className="p-3">
          <p className="font-semibold text-[var(--foreground)] truncate text-sm">{product.name}</p>
          <p className="text-[var(--brand-blue)] font-bold mt-0.5">
            {formatPrice(typeof product.price === "number" ? product.price : Number(product.price))}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
