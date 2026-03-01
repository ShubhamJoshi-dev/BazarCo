"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { User, ShoppingCart, Flame, TrendingUp, ImageIcon, ChevronRight, ShieldCheck, LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { browseProducts } from "@/lib/api";
import type { Product } from "@/types/api";

const SECTION_STAGGER = 0.05;
const CARD_STAGGER = 0.04;

export default function DashboardPage() {
  const { user } = useAuth();
  const isSeller = user?.role === "seller";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSeller) return;
    setLoading(true);
    browseProducts({ limit: 16 })
      .then((res) => setProducts(res.products))
      .finally(() => setLoading(false));
  }, [isSeller]);

  const hotSales = products.slice(0, 8);
  const bestSelling = products.slice(8, 16);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-2xl overflow-hidden settings-card card-glow p-6 md:p-8"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-red)]/10 via-transparent to-[var(--brand-blue)]/10 pointer-events-none" />
        <motion.div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          style={{
            backgroundImage: "linear-gradient(90deg, var(--brand-red), var(--brand-blue), var(--brand-red))",
            backgroundSize: "200% 200%",
          }}
        />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="min-w-0">
            <motion.h2
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="text-2xl font-bold text-[var(--brand-white)] mb-2"
            >
              {isSeller ? "Welcome to your seller space" : "Welcome back"}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="text-neutral-400 max-w-lg"
            >
              {isSeller
                ? "Manage your store and listings from here. Your seller dashboard is ready."
                : "Browse and buy from the marketplace. Your orders and profile are a click away."}
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex shrink-0 justify-end"
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <Image
                src="/logo.png"
                alt="BazarCo"
                width={140}
                height={58}
                className="h-12 w-auto md:h-14 drop-shadow-[0_0_20px_rgba(255,255,255,0.08)]"
                priority
              />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.35 }}
        className="grid gap-4 sm:grid-cols-2"
      >
        <motion.div
          whileHover={{ y: -2 }}
          className="group rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5 transition-all duration-200 hover:border-emerald-500/40 hover:bg-emerald-500/10"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 transition-colors group-hover:bg-emerald-500/30">
              <ShieldCheck className="h-6 w-6" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--brand-white)] mb-1">Verified & secure sellers</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Shop with confidence. Every seller on BazarCo is verified so you get a safe, trustworthy marketplace.
              </p>
            </div>
          </div>
        </motion.div>
        <motion.div
          whileHover={{ y: -2 }}
          className="group rounded-2xl border border-[var(--brand-blue)]/25 bg-[var(--brand-blue)]/5 p-5 transition-all duration-200 hover:border-[var(--brand-blue)]/40 hover:bg-[var(--brand-blue)]/10"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] transition-colors group-hover:bg-[var(--brand-blue)]/30">
              <LayoutGrid className="h-6 w-6" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--brand-white)] mb-1">Catalog management</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                {isSeller
                  ? "Organize products with categories and tags. Search, filter, and keep your catalog in shape."
                  : "Browse by category and tags. Find what you need quickly with smart search and filters."}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {!isSeller && (
        <>
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--brand-white)]">
                <Flame className="w-5 h-5 text-[var(--brand-red)]" />
                Hot sales
              </h3>
              <Link
                href="/dashboard/browse"
                className="text-sm font-medium text-[var(--brand-blue)] hover:underline flex items-center gap-1"
              >
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: 0.6 }}
                    className="rounded-xl border border-white/10 bg-white/5 aspect-[3/4]"
                  />
                ))}
              </div>
            ) : hotSales.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {hotSales.map((p, i) => (
                  <DashboardProductCard key={p.id} product={p} index={i} delay={SECTION_STAGGER + i * CARD_STAGGER} />
                ))}
              </div>
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-neutral-500 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-6 text-center"
              >
                No hot products yet. Check back soon.
              </motion.p>
            )}
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--brand-white)]">
                <TrendingUp className="w-5 h-5 text-[var(--brand-blue)]" />
                Best selling
              </h3>
              <Link
                href="/dashboard/browse"
                className="text-sm font-medium text-[var(--brand-blue)] hover:underline flex items-center gap-1"
              >
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: 0.6 }}
                    className="rounded-xl border border-white/10 bg-white/5 aspect-[3/4]"
                  />
                ))}
              </div>
            ) : bestSelling.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {bestSelling.map((p, i) => (
                  <DashboardProductCard key={p.id} product={p} index={i} delay={SECTION_STAGGER + i * CARD_STAGGER} />
                ))}
              </div>
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-neutral-500 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-6 text-center"
              >
                No best sellers yet. Check back soon.
              </motion.p>
            )}
          </motion.section>
        </>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -2 }}
        >
          <Link
            href={isSeller ? "/dashboard/products" : "/dashboard/browse"}
            className="block rounded-2xl border border-[var(--brand-red)]/30 bg-[var(--brand-red)]/10 p-5 hover:border-[var(--brand-red)]/50 hover:bg-[var(--brand-red)]/15 transition-all duration-200"
          >
            <div className="w-12 h-12 mb-3 flex items-center justify-center rounded-xl bg-white/5 text-[var(--brand-white)]">
              <ShoppingCart className="w-7 h-7" strokeWidth={2} />
            </div>
            <p className="font-semibold text-[var(--brand-white)] mb-1">
              {isSeller ? "Listings" : "My orders"}
            </p>
            <p className="text-sm text-neutral-400">
              {isSeller ? "Manage your products" : "Browse and buy from the marketplace"}
            </p>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -2 }}
        >
          <Link
            href="/dashboard/profile"
            className="block rounded-2xl border border-[var(--brand-blue)]/30 bg-[var(--brand-blue)]/10 p-5 hover:border-[var(--brand-blue)]/50 hover:bg-[var(--brand-blue)]/15 transition-all duration-200"
          >
            <div className="w-12 h-12 mb-3 flex items-center justify-center rounded-xl bg-white/5 text-[var(--brand-white)]">
              <User className="w-7 h-7" strokeWidth={2} />
            </div>
            <p className="font-semibold text-[var(--brand-white)] mb-1">
              Profile & settings
            </p>
            <p className="text-sm text-neutral-400">
              Update your name and view your account details
            </p>
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4 flex flex-wrap items-center gap-3"
      >
        <span className="text-sm text-neutral-500">Signed in as</span>
        <span className="text-sm font-medium text-[var(--brand-white)]">
          {user?.email}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isSeller
              ? "bg-[var(--brand-red)]/20 text-[var(--brand-red)]"
              : "bg-[var(--brand-blue)]/20 text-[var(--brand-blue)]"
          }`}
        >
          {user?.role}
        </span>
      </motion.div>
    </div>
  );
}

function DashboardProductCard({
  product,
  index,
  delay,
}: {
  product: Product;
  index: number;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 400, damping: 28 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Link
        href="/dashboard/browse"
        className="group block rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-[var(--brand-blue)]/30 hover:bg-white/[0.06] transition-all duration-200"
      >
        <div className="aspect-square bg-white/5 relative overflow-hidden">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-neutral-600">
              <ImageIcon className="w-12 h-12" />
            </div>
          )}
          {product.category && (
            <span className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
              {product.category}
            </span>
          )}
        </div>
        <div className="p-3">
          <p className="font-medium text-[var(--brand-white)] truncate text-sm">{product.name}</p>
          <p className="text-[var(--brand-blue)] font-semibold mt-0.5">
            ${typeof product.price === "number" ? product.price.toFixed(2) : product.price}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
