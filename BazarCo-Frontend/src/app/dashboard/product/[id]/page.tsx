"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ImageIcon,
  Star,
  Heart,
  ShoppingCart,
  MessageSquare,
  Send,
} from "lucide-react";
import {
  getProductById,
  addProductReview,
  toggleProductLike,
  addToCart,
  type ProductDetailResponse,
  type ProductReview,
} from "@/lib/api";
import { Toast } from "@/components/Toast";
import type { Product } from "@/types/api";

export default function ProductDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [data, setData] = useState<ProductDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartQty, setCartQty] = useState(1);
  const [cartToast, setCartToast] = useState<{ show: boolean; message: string }>({ show: false, message: "" });

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const res = await getProductById(id);
    setData(res);
    if (res) {
      setLiked(res.userLiked);
      setLikeCount(res.likeCount);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleLike = async () => {
    if (!id) return;
    const result = await toggleProductLike(id);
    if (result) {
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    }
  };

  const handleSubmitReview = async () => {
    if (!id || reviewRating < 1) return;
    setSubmittingReview(true);
    const ok = await addProductReview(id, reviewRating, reviewComment || undefined);
    setSubmittingReview(false);
    if (ok?.success) {
      setReviewRating(0);
      setReviewComment("");
      fetchProduct();
    }
  };

  const handleAddToCart = async () => {
    if (!id || !data?.product) return;
    setAddingToCart(true);
    const result = await addToCart(id, cartQty);
    setAddingToCart(false);
    if (result.success) {
      const name = result.productName ?? data.product.name;
      setCartToast({ show: true, message: `${name}${cartQty > 1 ? ` × ${cartQty}` : ""} added to cart` });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <motion.div animate={{ opacity: [0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="text-neutral-400">
          Loading product…
        </motion.div>
      </div>
    );
  }

  if (!data) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
        <p className="text-[var(--brand-white)] font-medium">Product not found</p>
        <Link href="/dashboard/browse" className="mt-4 inline-block text-[var(--brand-blue)] hover:underline">Back to Browse</Link>
      </motion.div>
    );
  }

  const { product, reviews, reviewCount, averageRating } = data;

  return (
    <div className="space-y-8">
      <Toast
        message={cartToast.message}
        visible={cartToast.show}
        onDismiss={() => setCartToast((p) => ({ ...p, show: false }))}
        duration={3500}
      />

      <Link
        href="/dashboard/browse"
        className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-[var(--brand-white)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Browse
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-8 lg:grid-cols-2"
      >
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" priority />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-neutral-600">
              <ImageIcon className="w-24 h-24" />
            </div>
          )}
        </div>

        <div className="space-y-6">
          {product.category && (
            <span className="inline-block rounded-full bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] px-3 py-1 text-sm font-medium">
              {product.category}
            </span>
          )}
          <h1 className="text-3xl font-bold text-[var(--brand-white)]">{product.name}</h1>
          <p className="text-2xl font-semibold text-[var(--brand-blue)]">${Number(product.price).toFixed(2)}</p>
          {product.description && (
            <p className="text-neutral-400 leading-relaxed">{product.description}</p>
          )}
          {(product.tags?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags!.map((tag) => (
                <span key={tag} className="rounded-lg bg-white/10 px-2.5 py-1 text-xs text-neutral-300">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="flex items-center gap-2 text-neutral-400">
              <Star className="w-5 h-5 text-amber-500" fill="currentColor" />
              <span className="text-sm">{averageRating > 0 ? averageRating.toFixed(1) : "—"} ({reviewCount} reviews)</span>
            </div>
            <button
              type="button"
              onClick={handleLike}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                liked
                  ? "border-[var(--brand-red)]/50 bg-[var(--brand-red)]/10 text-[var(--brand-red)]"
                  : "border-white/10 hover:bg-white/5 text-neutral-400"
              }`}
            >
              <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
              {likeCount} likes
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <div className="flex rounded-xl border border-white/10 overflow-hidden">
              <button
                type="button"
                onClick={() => setCartQty((q) => Math.max(1, q - 1))}
                className="px-4 py-3 bg-white/5 text-[var(--brand-white)] hover:bg-white/10"
              >
                −
              </button>
              <span className="px-4 py-3 min-w-[3rem] text-center text-[var(--brand-white)] font-medium">
                {cartQty}
              </span>
              <button
                type="button"
                onClick={() => setCartQty((q) => q + 1)}
                className="px-4 py-3 bg-white/5 text-[var(--brand-white)] hover:bg-white/10"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-blue)] px-6 py-3.5 font-semibold text-white hover:bg-[var(--brand-blue)]/90 disabled:opacity-60 transition-colors"
            >
              {addingToCart ? (
                <>
                  <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="inline-block h-5 w-5 rounded-full border-2 border-white/30 border-t-white" />
                  Adding to cart…
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  Add to cart
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--brand-white)] mb-6">
          <MessageSquare className="w-5 h-5 text-[var(--brand-blue)]" />
          Reviews ({reviewCount})
        </h2>

        <div className="space-y-4 mb-8">
          <p className="text-sm text-neutral-400">Add your review</p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReviewRating(r)}
                  className="p-1 rounded hover:opacity-80"
                >
                  <Star
                    className={`w-8 h-8 ${reviewRating >= r ? "text-amber-500 fill-amber-500" : "text-neutral-600"}`}
                  />
                </button>
              ))}
            </div>
            <input
              type="text"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Write a comment (optional)"
              className="flex-1 min-w-[200px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[var(--brand-white)] placeholder:text-neutral-500 focus:border-[var(--brand-blue)] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSubmitReview}
              disabled={submittingReview || reviewRating < 1}
              className="flex items-center gap-2 rounded-xl bg-[var(--brand-red)]/20 border border-[var(--brand-red)]/40 px-4 py-2.5 text-sm font-medium text-[var(--brand-red)] hover:bg-[var(--brand-red)]/30 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {submittingReview ? "Sending…" : "Submit"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-neutral-500 py-4">No reviews yet. Be the first to review!</p>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-medium text-[var(--brand-white)]">{rev.userName}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <Star
                        key={r}
                        className={`w-4 h-4 ${rev.rating >= r ? "text-amber-500 fill-amber-500" : "text-neutral-600"}`}
                      />
                    ))}
                  </div>
                </div>
                {rev.comment && <p className="text-sm text-neutral-400 mb-1">{rev.comment}</p>}
                <p className="text-xs text-neutral-500">{new Date(rev.createdAt).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>
      </motion.section>
    </div>
  );
}
