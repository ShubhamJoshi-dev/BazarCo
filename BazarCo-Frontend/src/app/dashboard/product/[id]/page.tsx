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
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  ImagePlus,
  X,
  Reply,
} from "lucide-react";
import {
  getProductById,
  addProductReview,
  uploadReviewImage,
  addReviewReaction,
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
  const tDashboard = useTranslations("dashboard");
  const [data, setData] = useState<ProductDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImageUrls, setReviewImageUrls] = useState<string[]>([]);
  const [reviewImageUploading, setReviewImageUploading] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyComment, setReplyComment] = useState("");
  const [replyImageUrls, setReplyImageUrls] = useState<string[]>([]);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [reactionLoadingId, setReactionLoadingId] = useState<string | null>(null);
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
    const ok = await addProductReview(id, reviewRating, reviewComment || undefined, undefined, reviewImageUrls.length ? reviewImageUrls : undefined);
    setSubmittingReview(false);
    if (ok?.success) {
      setReviewRating(0);
      setReviewComment("");
      setReviewImageUrls([]);
      fetchProduct();
    }
  };

  const handleReplySubmit = async (parentId: string) => {
    if (!id || !replyComment.trim()) return;
    setSubmittingReply(true);
    const ok = await addProductReview(id, 0, replyComment.trim(), parentId, replyImageUrls.length ? replyImageUrls : undefined);
    setSubmittingReply(false);
    if (ok?.success) {
      setReplyingToId(null);
      setReplyComment("");
      setReplyImageUrls([]);
      fetchProduct();
    }
  };

  const handleReaction = async (reviewId: string, type: "like" | "dislike") => {
    if (!id) return;
    setReactionLoadingId(reviewId);
    const result = await addReviewReaction(id, reviewId, type);
    setReactionLoadingId(null);
    if (result && data) {
      setData({
        ...data,
        reviews: data.reviews.map((r) => {
          if (r.id === reviewId) {
            return { ...r, likeCount: result.likeCount, dislikeCount: result.dislikeCount, userReaction: result.userReaction };
          }
          const replyIdx = r.replies?.findIndex((rep) => rep.id === reviewId);
          if (replyIdx !== undefined && replyIdx >= 0 && r.replies) {
            const replies = [...r.replies];
            replies[replyIdx] = { ...replies[replyIdx], likeCount: result.likeCount, dislikeCount: result.dislikeCount, userReaction: result.userReaction };
            return { ...r, replies };
          }
          return r;
        }),
      });
    }
  };

  const handleReviewImageSelect = async (e: React.ChangeEvent<HTMLInputElement>, isReply: boolean) => {
    const files = e.target.files;
    if (!files?.length || !id) return;
    const setUrls = isReply ? setReplyImageUrls : setReviewImageUrls;
    const max = 3;
    if (!isReply) setReviewImageUploading(true);
    const urls: string[] = [];
    for (let i = 0; i < Math.min(files.length, max); i++) {
      const res = await uploadReviewImage(id, files[i]);
      if (res?.url) urls.push(res.url);
    }
    setUrls((prev) => [...prev, ...urls].slice(0, max));
    if (!isReply) setReviewImageUploading(false);
    e.target.value = "";
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
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="h-10 w-10 rounded-full border-2 border-[var(--brand-blue)]/30 border-t-[var(--brand-blue)] animate-spin" />
        <p className="text-neutral-400 text-sm">Loading product…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center"
      >
        <p className="text-[var(--brand-white)] font-medium mb-1">Product not found</p>
        <p className="text-sm text-neutral-400 mb-6">This product may have been removed or the link is invalid.</p>
        <Link
          href="/dashboard/browse"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-blue)]/20 border border-[var(--brand-blue)]/40 px-4 py-2.5 text-sm font-medium text-[var(--brand-blue)] hover:bg-[var(--brand-blue)]/30 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Browse
        </Link>
      </motion.div>
    );
  }

  const { product, reviews, reviewCount, averageRating, sellerKycVerified } = data;

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
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-neutral-400 hover:text-[var(--brand-white)] hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Browse
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="grid gap-8 lg:gap-12 lg:grid-cols-[1fr_1fr]"
      >
        {/* Product image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08, duration: 0.4 }}
          className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_24px_48px_-12px_rgba(0,0,0,0.4)] group"
        >
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-neutral-600">
              <ImageIcon className="w-24 h-24" />
            </div>
          )}
        </motion.div>

        {/* Product details */}
        <div className="flex flex-col gap-6 lg:gap-7">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {product.category && (
                <motion.span
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 }}
                  className="inline-block rounded-full bg-[var(--brand-blue)]/15 text-[var(--brand-blue)] px-3 py-1 text-xs font-medium border border-[var(--brand-blue)]/30"
                >
                  {product.category}
                </motion.span>
              )}
              {sellerKycVerified && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.14 }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-400 px-3 py-1.5 text-xs font-semibold border border-emerald-500/40"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                  {tDashboard("verifiedSeller")}
                </motion.span>
              )}
            </div>
            <motion.h1
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--brand-white)] tracking-tight leading-tight"
            >
              {product.name}
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap items-baseline gap-3"
            >
              <span className="text-3xl font-bold text-[var(--brand-blue)]">
                ${Number(product.price).toFixed(2)}
              </span>
            </motion.div>
          </div>

          {product.description && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
              className="text-neutral-400 leading-relaxed max-w-xl"
            >
              {product.description}
            </motion.p>
          )}
          {(product.tags?.length ?? 0) > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              className="flex flex-wrap gap-2"
            >
              {product.tags!.map((tag) => (
                <span key={tag} className="rounded-lg bg-white/10 px-2.5 py-1 text-xs text-neutral-300 border border-white/10">
                  {tag}
                </span>
              ))}
            </motion.div>
          )}

          {/* Stats: rating + likes */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="flex flex-wrap items-center gap-4 py-3 border-y border-white/10"
          >
            <div className="flex items-center gap-2 text-neutral-400">
              <Star className="w-5 h-5 text-amber-500" fill="currentColor" />
              <span className="text-sm font-medium text-[var(--brand-white)]">
                {averageRating > 0 ? averageRating.toFixed(1) : "—"}
              </span>
              <span className="text-sm">({reviewCount} reviews)</span>
            </div>
            <motion.button
              type="button"
              onClick={handleLike}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                liked
                  ? "border-[var(--brand-red)]/50 bg-[var(--brand-red)]/10 text-[var(--brand-red)]"
                  : "border-white/10 bg-white/[0.03] text-neutral-400 hover:text-[var(--brand-white)] hover:bg-white/5"
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
              {likeCount} likes
            </motion.button>
          </motion.div>

          {/* Add to cart: quantity + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="flex rounded-xl border border-white/10 overflow-hidden bg-white/[0.04] w-fit">
              <button
                type="button"
                onClick={() => setCartQty((q) => Math.max(1, q - 1))}
                className="px-4 py-3 text-[var(--brand-white)] hover:bg-white/10 active:bg-white/15 transition-colors font-medium"
              >
                −
              </button>
              <span className="px-5 py-3 min-w-[3rem] text-center text-[var(--brand-white)] font-semibold bg-white/[0.04]">
                {cartQty}
              </span>
              <button
                type="button"
                onClick={() => setCartQty((q) => q + 1)}
                className="px-4 py-3 text-[var(--brand-white)] hover:bg-white/10 active:bg-white/15 transition-colors font-medium"
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
              className="flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-blue)] px-6 py-3.5 font-semibold text-white hover:bg-[var(--brand-blue)]/90 disabled:opacity-60 transition-all shadow-[0_4px_14px_-2px_rgba(100,181,246,0.4)]"
            >
              {addingToCart ? (
                <>
                  <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="inline-block h-5 w-5 rounded-full border-2 border-white/30 border-t-white" />
                  Adding…
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
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap gap-3"
              >
                <motion.button
                  type="button"
                  onClick={handleMessageSeller}
                  disabled={startingChat}
                  whileHover={!startingChat ? { scale: 1.02 } : {}}
                  whileTap={!startingChat ? { scale: 0.98 } : {}}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--brand-blue)]/40 bg-[var(--brand-blue)]/10 px-5 py-2.5 text-sm font-medium text-[var(--brand-blue)] hover:bg-[var(--brand-blue)]/20 hover:border-[var(--brand-blue)]/60 disabled:opacity-50 transition-colors"
                >
                  {startingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                  {tChat("messageSeller")}
                </motion.button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.44 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-white)] mb-3">
                  <HandCoins className="w-4 h-4 text-amber-500" />
                  {t("makeOffer")}
                </h3>
                {myOfferOnProduct ? (
                  <p className="text-sm text-neutral-400">
                    {t("youHaveOffer")}{" "}
                    <Link href="/dashboard/offers" className="text-[var(--brand-blue)] hover:underline font-medium">
                      {t("myOffers")}
                    </Link>
                  </p>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={t("proposedPrice")}
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-[var(--brand-white)] w-full sm:w-36 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/40 focus:border-[var(--brand-blue)]/40"
                    />
                    <input
                      type="text"
                      placeholder={t("optionalMessage")}
                      value={offerMessage}
                      onChange={(e) => setOfferMessage(e.target.value)}
                      className="flex-1 min-w-0 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-[var(--brand-white)] placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/40 focus:border-[var(--brand-blue)]/40"
                    />
                    <motion.button
                      type="button"
                      onClick={handleSubmitOffer}
                      disabled={submittingOffer || !offerPrice.trim()}
                      whileHover={!(submittingOffer || !offerPrice.trim()) ? { scale: 1.02 } : {}}
                      whileTap={!(submittingOffer || !offerPrice.trim()) ? { scale: 0.98 } : {}}
                      className="rounded-xl bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--brand-blue)]/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shrink-0"
                    >
                      {submittingOffer ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {t("makeOffer")}
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </div>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-white/10 bg-white/[0.04] shadow-lg overflow-hidden"
      >
        {/* Amazon-style header: rating summary + title */}
        <div className="p-6 lg:p-8 border-b border-white/10">
          <h2 className="text-xl font-bold text-[var(--brand-white)] mb-4">Customer reviews</h2>
          <div className="flex flex-wrap items-center gap-8">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-[var(--brand-white)]">
                {averageRating > 0 ? averageRating.toFixed(1) : "—"}
              </span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((r) => (
                  <Star
                    key={r}
                    className={`w-5 h-5 ${averageRating >= r ? "text-amber-500 fill-amber-500" : "text-neutral-600"}`}
                  />
                ))}
              </div>
            </div>
            <p className="text-sm text-neutral-400">
              {reviewCount === 0 ? "No reviews yet" : `Based on ${reviewCount} review${reviewCount !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {/* Write a review — prominent card */}
        <div className="p-6 lg:p-8 bg-white/[0.02] border-b border-white/10">
          <h3 className="text-base font-semibold text-[var(--brand-white)] mb-4">Write a customer review</h3>
          <div className="space-y-4 max-w-2xl">
            <div>
              <p className="text-sm text-neutral-400 mb-2">Your rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((r) => (
                  <motion.button
                    key={r}
                    type="button"
                    onClick={() => setReviewRating(r)}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-1 rounded focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${reviewRating >= r ? "text-amber-500 fill-amber-500" : "text-neutral-500 hover:text-amber-500/60"}`}
                    />
                  </motion.button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-neutral-400 mb-2">Your review (optional)</p>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience with this product. What did you like or dislike?"
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-[var(--brand-white)] placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 resize-y min-h-[100px]"
              />
            </div>
            <div>
              <p className="text-sm text-neutral-400 mb-2">Add photos (optional, max 3)</p>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-neutral-300 hover:text-[var(--brand-white)] hover:bg-white/[0.08] cursor-pointer transition-colors">
                  <ImagePlus className="w-5 h-5" />
                  Add photo
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={reviewImageUrls.length >= 3 || reviewImageUploading}
                    onChange={(e) => handleReviewImageSelect(e, false)}
                  />
                </label>
                {reviewImageUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {reviewImageUrls.map((url) => (
                      <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/10 ring-1 ring-white/5">
                        <Image src={url} alt="" fill className="object-cover" sizes="80px" />
                        <button
                          type="button"
                          onClick={() => setReviewImageUrls((p) => p.filter((u) => u !== url))}
                          className="absolute top-1 right-1 rounded-full bg-black/80 p-1 text-white hover:bg-black transition-colors"
                          aria-label="Remove photo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <motion.button
              type="button"
              onClick={handleSubmitReview}
              disabled={submittingReview || reviewRating < 1}
              whileHover={!(submittingReview || reviewRating < 1) ? { scale: 1.01 } : {}}
              whileTap={!(submittingReview || reviewRating < 1) ? { scale: 0.99 } : {}}
              className="rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              {submittingReview ? "Submitting…" : "Submit review"}
            </motion.button>
          </div>
        </div>

        {/* Review list */}
        <div className="p-6 lg:p-8">
          <h3 className="text-base font-semibold text-[var(--brand-white)] mb-4">
            {reviews.length === 0 ? "No reviews yet" : "All reviews"}
          </h3>
          {reviews.length === 0 ? (
            <p className="text-neutral-500 text-sm py-8 text-center rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
              Be the first to share your thoughts. Your review will help other customers.
            </p>
          ) : (
            <div className="space-y-6">
              {reviews.map((rev, i) => (
                <motion.article
                  key={rev.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * i }}
                  className="rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex gap-4">
                      <div className="shrink-0 w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-semibold text-sm">
                        {(rev.userName || "U").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-semibold text-[var(--brand-white)]">{rev.userName}</span>
                          {typeof rev.rating === "number" && (
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((r) => (
                                <Star
                                  key={r}
                                  className={`w-4 h-4 ${(rev.rating ?? 0) >= r ? "text-amber-500 fill-amber-500" : "text-neutral-600"}`}
                                />
                              ))}
                            </div>
                          )}
                          <span className="text-xs text-neutral-500">
                            {new Date(rev.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                          </span>
                        </div>
                        {rev.comment && (
                          <p className="text-[var(--brand-white)]/90 text-sm leading-relaxed mb-3">{rev.comment}</p>
                        )}
                        {(rev.imageUrls?.length ?? 0) > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {rev.imageUrls!.map((url) => (
                              <button
                                key={url}
                                type="button"
                                className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/10 hover:ring-2 hover:ring-amber-500/40 transition-shadow"
                              >
                                <Image src={url} alt="" fill className="object-cover" sizes="96px" />
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span className="text-neutral-500">Was this helpful?</span>
                          <motion.button
                            type="button"
                            onClick={() => handleReaction(rev.id, "like")}
                            disabled={reactionLoadingId === rev.id}
                            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors ${
                              rev.userReaction === "like"
                                ? "text-emerald-400 bg-emerald-500/20"
                                : "text-neutral-400 hover:text-[var(--brand-white)] hover:bg-white/5"
                            }`}
                          >
                            <ThumbsUp className="w-4 h-4" />
                            Yes ({rev.likeCount ?? 0})
                          </motion.button>
                          <motion.button
                            type="button"
                            onClick={() => handleReaction(rev.id, "dislike")}
                            disabled={reactionLoadingId === rev.id}
                            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors ${
                              rev.userReaction === "dislike"
                                ? "text-red-400 bg-red-500/20"
                                : "text-neutral-400 hover:text-[var(--brand-white)] hover:bg-white/5"
                            }`}
                          >
                            <ThumbsDown className="w-4 h-4" />
                            No ({rev.dislikeCount ?? 0})
                          </motion.button>
                          {user && (
                            <button
                              type="button"
                              onClick={() => setReplyingToId(replyingToId === rev.id ? null : rev.id)}
                              className="text-[var(--brand-blue)] hover:underline inline-flex items-center gap-1"
                            >
                              <Reply className="w-4 h-4" />
                              Reply
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {replyingToId === rev.id && (
                    <div className="border-t border-white/10 p-5 bg-white/[0.02]">
                      <p className="text-sm font-medium text-[var(--brand-white)] mb-3">Reply to {rev.userName}</p>
                      {replyImageUrls.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {replyImageUrls.map((url) => (
                            <div key={url} className="relative w-14 h-14 rounded-lg overflow-hidden border border-white/10">
                              <Image src={url} alt="" fill className="object-cover" sizes="56px" />
                              <button
                                type="button"
                                onClick={() => setReplyImageUrls((p) => p.filter((u) => u !== url))}
                                className="absolute top-0.5 right-0.5 rounded-full bg-black/80 p-0.5 text-white"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          value={replyComment}
                          onChange={(e) => setReplyComment(e.target.value)}
                          placeholder="Write your reply…"
                          className="flex-1 min-w-0 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-[var(--brand-white)] placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                        />
                        <div className="flex items-center gap-2">
                          <label className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-neutral-400 hover:text-[var(--brand-white)] cursor-pointer shrink-0 inline-flex items-center gap-1">
                            <ImagePlus className="w-4 h-4" /> Photo
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              disabled={replyImageUrls.length >= 3}
                              onChange={(e) => handleReviewImageSelect(e, true)}
                            />
                          </label>
                          <motion.button
                            type="button"
                            onClick={() => handleReplySubmit(rev.id)}
                            disabled={submittingReply || !replyComment.trim()}
                            className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
                          >
                            {submittingReply ? "Sending…" : "Send"}
                          </motion.button>
                          <button
                            type="button"
                            onClick={() => { setReplyingToId(null); setReplyComment(""); setReplyImageUrls([]); }}
                            className="text-sm text-neutral-500 hover:text-[var(--brand-white)]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {(rev.replies?.length ?? 0) > 0 && (
                    <div className="border-t border-white/10">
                      {rev.replies!.map((rep) => (
                        <div
                          key={rep.id}
                          className="flex gap-3 pl-5 pr-5 py-4 bg-white/[0.02] ml-4 border-l-2 border-amber-500/30"
                        >
                          <div className="shrink-0 w-8 h-8 rounded-full bg-[var(--brand-blue)]/20 flex items-center justify-center text-[var(--brand-blue)] font-medium text-xs">
                            {(rep.userName || "U").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-[var(--brand-white)]">{rep.userName}</span>
                              <span className="text-xs text-neutral-500">
                                {new Date(rep.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                              </span>
                            </div>
                            {rep.comment && <p className="text-sm text-neutral-400 leading-relaxed mb-2">{rep.comment}</p>}
                            {(rep.imageUrls?.length ?? 0) > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {rep.imageUrls.map((url) => (
                                  <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10">
                                    <Image src={url} alt="" fill className="object-cover" sizes="64px" />
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs">
                              <button
                                type="button"
                                onClick={() => handleReaction(rep.id, "like")}
                                disabled={reactionLoadingId === rep.id}
                                className={`inline-flex items-center gap-1 ${rep.userReaction === "like" ? "text-emerald-400" : "text-neutral-500 hover:text-[var(--brand-white)]"}`}
                              >
                                <ThumbsUp className="w-3.5 h-3.5" /> {rep.likeCount ?? 0}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReaction(rep.id, "dislike")}
                                disabled={reactionLoadingId === rep.id}
                                className={`inline-flex items-center gap-1 ${rep.userReaction === "dislike" ? "text-red-400" : "text-neutral-500 hover:text-[var(--brand-white)]"}`}
                              >
                                <ThumbsDown className="w-3.5 h-3.5" /> {rep.dislikeCount ?? 0}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
}
