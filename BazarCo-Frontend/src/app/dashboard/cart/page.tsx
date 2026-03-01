"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingCart, ImageIcon, Plus, Minus, Trash2 } from "lucide-react";
import {
  getCart,
  updateCartItemQuantity,
  removeFromCart,
  type CartItem,
} from "@/lib/api";

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    const res = await getCart();
    setItems(res.items);
    setTotal(res.total);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleQuantity = async (productId: string, newQty: number) => {
    if (newQty < 1) {
      handleRemove(productId);
      return;
    }
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
      <div className="flex items-center justify-center min-h-[40vh]">
        <motion.div
          animate={{ opacity: [0.5, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="text-neutral-400"
        >
          Loading cart…
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--brand-white)] flex items-center gap-2">
          <ShoppingCart className="w-7 h-7 text-[var(--brand-blue)]" />
          Your cart
        </h1>
        {items.length > 0 && (
          <span className="text-sm text-neutral-400">{items.length} item{items.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center"
        >
          <ShoppingCart className="mx-auto w-14 h-14 text-neutral-600 mb-4" />
          <p className="text-[var(--brand-white)] font-medium mb-2">Your cart is empty</p>
          <p className="text-sm text-neutral-400 mb-6">Add items from Browse to see them here.</p>
          <Link
            href="/dashboard/browse"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--brand-blue)]/90"
          >
            Browse products
          </Link>
        </motion.div>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((item) => (
              <motion.div
                key={item.productId}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 flex flex-col sm:flex-row gap-4"
              >
                <div className="flex gap-4 flex-1 min-w-0">
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-white/5 shrink-0 overflow-hidden">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="112px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-neutral-600">
                        <ImageIcon className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard/product/${item.productId}`}
                      className="font-semibold text-[var(--brand-white)] hover:text-[var(--brand-blue)] line-clamp-2"
                    >
                      {item.name}
                    </Link>
                    <p className="text-[var(--brand-blue)] font-medium mt-1">${Number(item.price).toFixed(2)} each</p>
                    <p className="text-sm text-neutral-400 mt-1">Subtotal: ${item.subtotal.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex items-center rounded-xl border border-white/10 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleQuantity(item.productId, item.quantity - 1)}
                      disabled={updating === item.productId}
                      className="p-2.5 bg-white/5 text-[var(--brand-white)] hover:bg-white/10 disabled:opacity-50"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="min-w-[2.5rem] text-center text-sm font-medium text-[var(--brand-white)]">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuantity(item.productId, item.quantity + 1)}
                      disabled={updating === item.productId}
                      className="p-2.5 bg-white/5 text-[var(--brand-white)] hover:bg-white/10 disabled:opacity-50"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.productId)}
                    disabled={updating === item.productId}
                    className="p-2.5 rounded-xl border border-[var(--brand-red)]/30 text-[var(--brand-red)] hover:bg-[var(--brand-red)]/10 disabled:opacity-50 transition-colors"
                    aria-label="Remove from cart"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-[var(--brand-blue)]/30 bg-[var(--brand-blue)]/5 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <p className="text-lg font-semibold text-[var(--brand-white)]">
              Total: <span className="text-[var(--brand-blue)]">${total.toFixed(2)}</span>
            </p>
            <Link
              href="/dashboard/browse"
              className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-medium text-[var(--brand-white)] hover:bg-white/5 text-center transition-colors"
            >
              Continue shopping
            </Link>
          </motion.div>
        </>
      )}
    </div>
  );
}
