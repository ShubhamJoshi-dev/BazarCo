"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, ImageIcon, Plus, Minus, Trash2, ChevronRight, ShoppingBag, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import { getCart, updateCartItemQuantity, removeFromCart, type CartItem } from "@/lib/api";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function CartPage() {
  const t = useTranslations("common");
  const { formatPrice } = useCurrency();
  const [items, setItems]       = useState<CartItem[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    const res = await getCart();
    setItems(res.items); setTotal(res.total);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const handleQuantity = async (productId: string, newQty: number) => {
    if (newQty < 1) { handleRemove(productId); return; }
    setUpdating(productId);
    const ok = await updateCartItemQuantity(productId, newQty);
    setUpdating(null);
    if (ok) fetchCart();
  };

  const handleRemove = async (productId: string) => {
    setUpdating(productId);
    const ok = await removeFromCart(productId);
    setUpdating(null);
    if (ok) fetchCart();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div key={i}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
            className="clay-card h-32 relative overflow-hidden">
            <div className="absolute inset-0 loading-shimmer-bar opacity-10 rounded-[24px]" />
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[var(--foreground)] flex items-center gap-3">
          <span className="w-11 h-11 flex items-center justify-center rounded-2xl bg-[var(--brand-blue)]/15 text-[var(--brand-blue)]"
            style={{ boxShadow: "var(--clay-shadow-blue)" }}>
            <ShoppingCart className="w-5 h-5" />
          </span>
          Your Cart
        </h1>
        {items.length > 0 && (
          <span className="clay-badge-blue">{items.length} item{items.length !== 1 ? "s" : ""}</span>
        )}
      </motion.div>

      {items.length === 0 ? (
        /* Empty state */
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="clay-card p-16 text-center">
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            <ShoppingBag className="mx-auto w-16 h-16 text-[var(--brand-muted)]/40 mb-5" />
          </motion.div>
          <p className="text-xl font-black text-[var(--foreground)] mb-2">Your cart is empty</p>
          <p className="text-sm text-[var(--brand-muted)] mb-7">
            Discover amazing products and add them to your cart.
          </p>
          <Link href="/dashboard/browse" className="clay-btn-blue px-8 py-3 text-sm inline-flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" /> Browse Products
          </Link>
        </motion.div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Cart items */}
          <div className="flex-1 min-w-0 space-y-4">
            <AnimatePresence mode="popLayout">
              {items.map((item, i) => (
                <motion.div key={item.productId} layout
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -40, scale: 0.95 }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 380, damping: 28 }}
                  whileHover={{ y: -3 }}
                  className="clay-card p-4 sm:p-5"
                >
                  <div className="flex gap-4">
                    {/* Product image */}
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[var(--brand-border)] shrink-0 overflow-hidden"
                      style={{ boxShadow: "var(--clay-shadow-neutral)" }}>
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="112px" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[var(--brand-muted)]">
                          <ImageIcon className="w-10 h-10" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/dashboard/product/${item.productId}`}
                        className="font-bold text-[var(--foreground)] hover:text-[var(--brand-blue)] transition-colors line-clamp-2">
                        {item.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="clay-badge-blue">{formatPrice(Number(item.price))} each</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Tag className="w-3.5 h-3.5 text-[var(--brand-muted)]" />
                        <span className="text-sm text-[var(--brand-muted)]">
                          Subtotal: <span className="font-black text-[var(--foreground)]">{formatPrice(item.subtotal)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Remove (top-right on mobile) */}
                    <motion.button type="button" onClick={() => handleRemove(item.productId)}
                      disabled={updating === item.productId}
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      className="shrink-0 w-9 h-9 flex items-center justify-center rounded-2xl text-[var(--brand-red)] disabled:opacity-40 transition-all hover:bg-[var(--brand-red)]/10"
                      style={{ boxShadow: "var(--clay-shadow-red)" }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>

                  {/* Quantity stepper */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center rounded-2xl overflow-hidden border-2 border-[var(--brand-border)]"
                      style={{ boxShadow: "var(--clay-shadow-neutral)" }}>
                      <motion.button type="button"
                        onClick={() => handleQuantity(item.productId, item.quantity - 1)}
                        disabled={updating === item.productId}
                        whileTap={{ scale: 0.85 }}
                        className="w-10 h-10 flex items-center justify-center bg-[var(--brand-red)]/10 text-[var(--brand-red)] hover:bg-[var(--brand-red)]/20 disabled:opacity-40 transition-colors font-black text-lg">
                        <Minus className="w-4 h-4" />
                      </motion.button>
                      <span className="w-12 text-center font-black text-[var(--foreground)] text-base">
                        {item.quantity}
                      </span>
                      <motion.button type="button"
                        onClick={() => handleQuantity(item.productId, item.quantity + 1)}
                        disabled={updating === item.productId}
                        whileTap={{ scale: 0.85 }}
                        className="w-10 h-10 flex items-center justify-center bg-[var(--brand-blue)]/10 text-[var(--brand-blue)] hover:bg-[var(--brand-blue)]/20 disabled:opacity-40 transition-colors font-black text-lg">
                        <Plus className="w-4 h-4" />
                      </motion.button>
                    </div>
                    <p className="text-xs text-[var(--brand-muted)]">
                      {item.quantity} × {formatPrice(Number(item.price))}
                    </p>
                  </div>

                  {/* Loading bar when updating */}
                  {updating === item.productId && (
                    <div className="mt-3 h-0.5 w-full rounded-full overflow-hidden bg-[var(--brand-border)]">
                      <motion.div className="h-full bg-[var(--brand-blue)] rounded-full"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order summary */}
          <motion.div
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="clay-card p-6 w-full lg:w-80 shrink-0 lg:sticky lg:top-4 space-y-5"
          >
            {/* Gradient accent */}
            <div className="h-1 w-full rounded-full bg-gradient-to-r from-[var(--brand-red)] to-[var(--brand-blue)] -mt-1" />

            <h2 className="text-lg font-black text-[var(--foreground)]">Order Summary</h2>

            <div className="space-y-3">
              {items.map(item => (
                <div key={item.productId} className="flex justify-between items-center gap-2 text-sm">
                  <span className="text-[var(--brand-muted)] truncate flex-1">{item.name}</span>
                  <span className="font-semibold text-[var(--foreground)] shrink-0">
                    ×{item.quantity} — {formatPrice(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-[var(--brand-border)] to-transparent" />

            <div className="flex justify-between items-center">
              <span className="font-bold text-[var(--foreground)]">Total</span>
              <span className="text-2xl font-black text-[var(--brand-blue)]">{formatPrice(total)}</span>
            </div>

            <div className="space-y-2.5">
              <Link href="/dashboard/checkout"
                className="clay-btn-red w-full py-3.5 text-sm flex items-center justify-center gap-2">
                {t("proceedToCheckout")} <ChevronRight className="w-4 h-4" />
              </Link>
              <Link href="/dashboard/browse"
                className="clay-btn-blue w-full py-3 text-sm flex items-center justify-center gap-2 opacity-80">
                {t("continueShopping")}
              </Link>
            </div>

            <p className="text-[10px] text-center text-[var(--brand-muted)]">
              Secure checkout · KYC verified sellers
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
