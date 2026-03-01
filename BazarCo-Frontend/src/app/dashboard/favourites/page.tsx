"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ImageIcon } from "lucide-react";
import type { Product } from "@/types/api";
import { favouritesList, favouriteRemove } from "@/lib/api";

export default function FavouritesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    favouritesList().then((list) => {
      setProducts(list);
      setLoading(false);
    });
  }, []);

  const removeFavourite = async (productId: string) => {
    const ok = await favouriteRemove(productId);
    if (ok) setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-neutral-400">Loading favourites...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center"
      >
        <Heart className="mx-auto w-14 h-14 text-neutral-600 mb-4" />
        <p className="text-[var(--brand-white)] font-medium mb-1">No favourites yet</p>
        <p className="text-sm text-neutral-400 mb-6">Save products you like from Browse.</p>
        <Link
          href="/dashboard/browse"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-blue)]/90"
        >
          Browse products
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[var(--brand-white)]">Favourites</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {products.map((p, i) => (
            <motion.article
              key={p.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="group rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-[var(--brand-blue)]/30 transition-all"
            >
              <div className="aspect-square bg-white/5 relative">
                {p.imageUrl ? (
                  <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="33vw" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-neutral-600">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeFavourite(p.id)}
                  className="absolute top-2 right-2 rounded-full bg-black/60 p-2 backdrop-blur-sm hover:bg-[var(--brand-red)]/80 transition-colors"
                  aria-label="Remove from favourites"
                >
                  <Heart className="w-5 h-5 fill-[var(--brand-red)] text-[var(--brand-red)]" />
                </button>
                <div className="absolute bottom-2 right-2 rounded-lg bg-[var(--brand-blue)] px-3 py-1.5 text-sm font-semibold text-white">
                  ${Number(p.price).toFixed(2)}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-[var(--brand-white)] truncate">{p.name}</h3>
                <div className="mt-2 flex gap-2">
                  <Link
                    href="/dashboard/browse"
                    className="text-sm text-[var(--brand-blue)] hover:underline"
                  >
                    View in browse
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
