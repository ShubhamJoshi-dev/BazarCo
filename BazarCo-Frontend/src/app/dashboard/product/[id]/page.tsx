"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
  HandCoins,
  Loader2,
} from "lucide-react";
import {
  getProductById,
  addProductReview,
  toggleProductLike,
  addToCart,
  createOffer,
  listOffers,
  createConversationByProduct,
  type ProductDetailResponse,
  type ProductReview,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "next-intl";
import { Toast } from "@/components/Toast";
import type { Product } from "@/types/api";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const { user } = useAuth();
  const t = useTranslations("offers");
  const tChat = useTranslations("chat");
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
  const [actionToast, setActionToast] = useState<{ show: boolean; message: string; isError?: boolean }>({ show: false, message: "" });
  const [myOfferOnProduct, setMyOfferOnProduct] = useState<{ id: string; status: string } | null>(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

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

  useEffect(() => {
    if (!id || !user || !data?.product || user.id === data.product.sellerId) {
      setMyOfferOnProduct(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const list = await listOffers({ asSeller: false });
      if (cancelled) return;
      const existing = list.find((o) => o.productId === id);
      setMyOfferOnProduct(existing ? { id: existing.id, status: existing.status } : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, user?.id, data?.product?.sellerId]);

  const handleSubmitOffer = async () => {
    if (!id) return;
    const price = parseFloat(offerPrice);
    if (Number.isNaN(price) || price < 0) {
      setActionToast({ show: true, message: "Please enter a valid price.", isError: true });
      return;
    }
    setSubmittingOffer(true);
    const result = await createOffer(id, price, offerMessage || undefined);
    setSubmittingOffer(false);
    if (result.success) {
      setMyOfferOnProduct({ id: result.offer.id, status: result.offer.status });
      setOfferPrice("");
      setOfferMessage("");
      setActionToast({ show: true, message: "Offer sent! Check Offers for updates." });
    } else {
      setActionToast({ show: true, message: result.error, isError: true });
    }
  };

  const handleMessageSeller = async () => {
    if (!id) return;
    setStartingChat(true);
    const result = await createConversationByProduct(id);
    setStartingChat(false);
    if (result.success) {
      const convId = result.conversation.id;
      if (convId) router.push(`/dashboard/chat/${convId}`);
      else setActionToast({ show: true, message: "Chat started. Open Chat from the menu.", isError: false });
    } else {
      setActionToast({ show: true, message: result.error, isError: true });
    }
  };

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
      <Toast
        message={actionToast.message}
        visible={actionToast.show}
        onDismiss={() => setActionToast((p) => ({ ...p, show: false }))}
        duration={actionToast.isError ? 5000 : 3500}
        variant={actionToast.isError ? "error" : "success"}
      />

      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link
          href="/dashboard/browse"
          className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-[var(--brand-white)] transition-all duration-200 hover:gap-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Browse
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="grid gap-8 lg:gap-12 lg:grid-cols-2"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 shadow-[0_0_40px_-12px_rgba(59,130,246,0.15)]"
        >
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-neutral-600">
              <ImageIcon className="w-24 h-24" />
            </div>
          )}
        </motion.div>

        <div className="space-y-6">
          {product.category && (
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="inline-block rounded-full bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] px-3 py-1.5 text-sm font-medium border border-[var(--brand-blue)]/30"
            >
              {product.category}
            </motion.span>
          )}
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl lg:text-4xl font-bold text-[var(--brand-white)] tracking-tight"
          >
            {product.name}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-3xl font-bold text-[var(--brand-blue)] bg-[var(--brand-blue)]/10 border border-[var(--brand-blue)]/30 rounded-2xl px-5 py-3 w-fit"
          >
            ${Number(product.price).toFixed(2)}
          </motion.p>
          {product.description && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-neutral-400 leading-relaxed"
            >
              {product.description}
            </motion.p>
          )}
          {(product.tags?.length ?? 0) > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex flex-wrap gap-2"
            >
              {product.tags!.map((tag) => (
                <span key={tag} className="rounded-lg bg-white/10 px-2.5 py-1 text-xs text-neutral-300 border border-white/10">
                  {tag}
                </span>
              ))}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center gap-4 pt-2"
          >
            <div className="flex items-center gap-2 text-neutral-400">
              <Star className="w-5 h-5 text-amber-500" fill="currentColor" />
              <span className="text-sm">{averageRating > 0 ? averageRating.toFixed(1) : "—"} ({reviewCount} reviews)</span>
            </div>
            <motion.button
              type="button"
              onClick={handleLike}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                liked
                  ? "border-[var(--brand-red)]/50 bg-[var(--brand-red)]/10 text-[var(--brand-red)]"
                  : "border-white/10 hover:bg-white/5 text-neutral-400 hover:text-[var(--brand-white)]"
              }`}
            >
              <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
              {likeCount} likes
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex flex-col sm:flex-row gap-3 pt-2"
          >
            <div className="flex rounded-xl border border-white/10 overflow-hidden bg-white/[0.04]">
              <button
                type="button"
                onClick={() => setCartQty((q) => Math.max(1, q - 1))}
                className="px-4 py-3 text-[var(--brand-white)] hover:bg-white/10 transition-colors"
              >
                −
              </button>
              <span className="px-4 py-3 min-w-[3rem] text-center text-[var(--brand-white)] font-medium">
                {cartQty}
              </span>
              <button
                type="button"
                onClick={() => setCartQty((q) => q + 1)}
                className="px-4 py-3 text-[var(--brand-white)] hover:bg-white/10 transition-colors"
              >
                +
              </button>
            </div>
            <motion.button
              type="button"
              onClick={handleAddToCart}
              disabled={addingToCart}
              whileHover={!addingToCart ? { scale: 1.02 } : {}}
              whileTap={!addingToCart ? { scale: 0.98 } : {}}
              className="flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-blue)] px-6 py-3.5 font-semibold text-white hover:bg-[var(--brand-blue)]/90 disabled:opacity-60 transition-colors shadow-lg shadow-[var(--brand-blue)]/20"
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
            </motion.button>
          </motion.div>

          {user && user.id !== product.sellerId && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="pt-2"
              >
                <motion.button
                  type="button"
                  onClick={handleMessageSeller}
                  disabled={startingChat}
                  whileHover={!startingChat ? { scale: 1.02 } : {}}
                  whileTap={!startingChat ? { scale: 0.98 } : {}}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--brand-blue)]/50 bg-[var(--brand-blue)]/10 px-5 py-3 text-sm font-medium text-[var(--brand-blue)] hover:bg-[var(--brand-blue)]/20 hover:border-[var(--brand-blue)]/70 disabled:opacity-50 transition-colors"
                >
                  {startingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                  {tChat("messageSeller")}
                </motion.button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="rounded-2xl border border-[var(--brand-blue)]/30 bg-gradient-to-b from-[var(--brand-blue)]/[0.08] to-[var(--brand-blue)]/[0.02] p-6 shadow-[0_0_0_1px_rgba(59,130,246,0.1)]"
              >
                <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--brand-white)] mb-4">
                  <HandCoins className="w-5 h-5 text-[var(--brand-blue)]" />
                  {t("makeOffer")}
                </h3>
                {myOfferOnProduct ? (
                  <p className="text-sm text-neutral-300">
                    {t("youHaveOffer")}{" "}
                    <Link href="/dashboard/offers" className="text-[var(--brand-blue)] hover:underline font-medium">
                      {t("myOffers")}
                    </Link>
                  </p>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={t("proposedPrice")}
                        value={offerPrice}
                        onChange={(e) => setOfferPrice(e.target.value)}
                        className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-[var(--brand-white)] w-full sm:w-40 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/50 focus:border-[var(--brand-blue)]/50 transition-shadow"
                      />
                      <input
                        type="text"
                        placeholder={t("optionalMessage")}
                        value={offerMessage}
                        onChange={(e) => setOfferMessage(e.target.value)}
                        className="flex-1 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-[var(--brand-white)] placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/50 focus:border-[var(--brand-blue)]/50 transition-shadow"
                      />
                      <motion.button
                        type="button"
                        onClick={handleSubmitOffer}
                        disabled={submittingOffer || !offerPrice.trim()}
                        whileHover={!(submittingOffer || !offerPrice.trim()) ? { scale: 1.02 } : {}}
                        whileTap={!(submittingOffer || !offerPrice.trim()) ? { scale: 0.98 } : {}}
                        className="flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--brand-blue)]/90 disabled:opacity-50 transition-colors"
                      >
                        {submittingOffer ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {t("makeOffer")}
                      </motion.button>
                    </div>
                  </>
                )}
              </motion.div>
            </>
          )}
        </div>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
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
