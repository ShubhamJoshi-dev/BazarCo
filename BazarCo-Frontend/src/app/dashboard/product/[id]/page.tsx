"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ImageIcon, Star, Heart, ShoppingCart, MessageSquare,
  HandCoins, Loader2, ShieldCheck, ThumbsUp, ThumbsDown,
  ImagePlus, X, Reply, Send, Sparkles, CheckCircle2, Package,
} from "lucide-react";
import {
  getProductById, addProductReview, uploadReviewImage, addReviewReaction,
  toggleProductLike, addToCart, createOffer, listOffers,
  createConversationByProduct,
  type ProductDetailResponse, type ProductReview, type ProductReviewReply,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "next-intl";
import { Toast } from "@/components/Toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ProductDetailMarketView } from "@/components/marketplace/ProductDetailMarketView";
import { getLoginHref } from "@/lib/loginRedirect";

/* ─── Avatar gradient ── */
function Avatar({ name, size = 10, colors }: { name: string; size?: number; colors: [string, string] }) {
  const initials = (name || "U").slice(0, 2).toUpperCase();
  const sizeClass = size <= 8 ? "w-8 h-8" : "w-10 h-10";
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-white shrink-0 select-none`}
      style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`, fontSize: size <= 8 ? 11 : 13, boxShadow: `0 2px 10px ${colors[0]}50` }}
    >
      {initials}
    </div>
  );
}

const AVATAR_PALETTE: [string, string][] = [
  ["#4da6ff", "#7c3aed"], ["#f59e0b", "#ef4444"], ["#22c55e", "#0ea5e9"],
  ["#ec4899", "#8b5cf6"], ["#f97316", "#eab308"], ["#06b6d4", "#6366f1"],
];
function avatarColors(id: string): [string, string] {
  let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

/* ─── Interactive star picker ── */
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const labels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((r) => {
          const filled = (hover || value) >= r;
          return (
            <motion.button
              key={r} type="button"
              onClick={() => onChange(r)}
              onMouseEnter={() => setHover(r)}
              onMouseLeave={() => setHover(0)}
              whileHover={{ scale: 1.3, y: -3 }}
              whileTap={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
              className="focus:outline-none"
            >
              <Star className={`w-8 h-8 transition-colors duration-150 ${filled ? "text-amber-400 fill-amber-400" : "text-[var(--brand-border)]"}`} />
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        {(hover || value) > 0 && (
          <motion.span
            key={hover || value}
            initial={{ opacity: 0, y: 4, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.85 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="text-sm font-bold text-amber-400"
          >
            {labels[hover || value]}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Rating bar ── */
function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const ref = useRef(null);
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs text-[var(--brand-muted)] w-3 text-right">{star}</span>
      <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
      <div ref={ref} className="flex-1 h-1.5 rounded-full bg-[var(--brand-border)] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-amber-400"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <span className="text-xs text-[var(--brand-muted)] w-4">{count}</span>
    </div>
  );
}

/* ─── Review card ── */
function ReviewCard({
  rev, depth = 0, user, productId, onReaction, onReply, reactionLoadingId,
}: {
  rev: ProductReview | ProductReviewReply; depth?: number; user: { id: string } | null; productId: string;
  onReaction: (id: string, type: "like" | "dislike") => void;
  onReply: (parentId: string, comment: string, images: string[]) => Promise<void>;
  reactionLoadingId: string | null;
}) {
  const [replying, setReplying]     = useState(false);
  const [replyText, setReplyText]   = useState("");
  const [replyImgs, setReplyImgs]   = useState<string[]>([]);
  const [replyImgUploading, setReplyImgUploading] = useState(false);
  const [sending, setSending]       = useState(false);
  const [liked, setLiked]           = useState(rev.userReaction === "like");
  const [disliked, setDisliked]     = useState(rev.userReaction === "dislike");
  const [likeCount, setLikeCount]   = useState(rev.likeCount ?? 0);
  const [dislikeCount, setDislikeCount] = useState(rev.dislikeCount ?? 0);
  const colors = avatarColors(rev.id);
  const isReply = depth > 0;

  const submitReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    await onReply(rev.id, replyText, replyImgs);
    setSending(false);
    setReplying(false);
    setReplyText("");
    setReplyImgs([]);
  };

  const react = async (type: "like" | "dislike") => {
    const wasLiked    = liked;
    const wasDisliked = disliked;
    if (type === "like") {
      setLiked(!wasLiked); setDisliked(false);
      setLikeCount((n) => n + (wasLiked ? -1 : 1));
      if (wasDisliked) setDislikeCount((n) => n - 1);
    } else {
      setDisliked(!wasDisliked); setLiked(false);
      setDislikeCount((n) => n + (wasDisliked ? -1 : 1));
      if (wasLiked) setLikeCount((n) => n - 1);
    }
    onReaction(rev.id, type);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
      className={isReply ? "ml-10 border-l-2 border-[var(--brand-border)] pl-4" : ""}
    >
      <div className={`rounded-2xl ${isReply ? "bg-[var(--card-bg)]/50" : "clay-card"} p-4`}>
        {/* Header row */}
        <div className="flex items-start gap-3">
          <Avatar name={rev.userName || "U"} size={isReply ? 8 : 10} colors={colors} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-sm text-[var(--foreground)]">{rev.userName || "Anonymous"}</span>
              {typeof rev.rating === "number" && rev.rating > 0 && (
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <Star key={r} className={`w-3 h-3 ${(rev.rating ?? 0) >= r ? "text-amber-400 fill-amber-400" : "text-[var(--brand-border)]"}`} />
                  ))}
                </div>
              )}
              <span className="text-[11px] text-[var(--brand-muted)] ml-auto">
                {new Date(rev.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
              </span>
            </div>

            {/* Comment */}
            {rev.comment && (
              <p className="text-sm text-[var(--foreground)]/90 leading-relaxed mt-1.5 mb-3">{rev.comment}</p>
            )}

            {/* Image grid */}
            {(rev.imageUrls?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {rev.imageUrls!.map((url) => (
                  <motion.div key={url} whileHover={{ scale: 1.05 }}
                    className="relative w-20 h-20 rounded-xl overflow-hidden border border-[var(--brand-border)] cursor-pointer"
                  >
                    <Image src={url} alt="" fill className="object-cover" sizes="80px" />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Like */}
              <motion.button
                type="button" onClick={() => react("like")}
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.88 }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${
                  liked
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : "bg-transparent text-[var(--brand-muted)] border-[var(--brand-border)] hover:border-emerald-500/40 hover:text-emerald-400"
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <AnimatePresence mode="wait">
                  <motion.span key={likeCount} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 6, opacity: 0 }} transition={{ duration: 0.15 }}>
                    {likeCount}
                  </motion.span>
                </AnimatePresence>
              </motion.button>

              {/* Dislike */}
              <motion.button
                type="button" onClick={() => react("dislike")}
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.88 }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${
                  disliked
                    ? "bg-[var(--brand-red)]/20 text-[var(--brand-red)] border-[var(--brand-red)]/40"
                    : "bg-transparent text-[var(--brand-muted)] border-[var(--brand-border)] hover:border-[var(--brand-red)]/40 hover:text-[var(--brand-red)]"
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                <AnimatePresence mode="wait">
                  <motion.span key={dislikeCount} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 6, opacity: 0 }} transition={{ duration: 0.15 }}>
                    {dislikeCount}
                  </motion.span>
                </AnimatePresence>
              </motion.button>

              {/* Reply */}
              {user && !isReply && (
                <motion.button
                  type="button" onClick={() => setReplying((r) => !r)}
                  whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.88 }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${
                    replying
                      ? "bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] border-[var(--brand-blue)]/40"
                      : "bg-transparent text-[var(--brand-muted)] border-[var(--brand-border)] hover:border-[var(--brand-blue)]/40 hover:text-[var(--brand-blue)]"
                  }`}
                >
                  <Reply className="w-3.5 h-3.5" /> Reply
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Inline reply composer */}
        <AnimatePresence>
          {replying && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              className="overflow-hidden"
            >
              <div className="flex gap-3 items-start pt-3 border-t border-[var(--brand-border)]">
                {user && <Avatar name={user?.id || "U"} size={8} colors={avatarColors(user?.id || "u")} />}
                <div className="flex-1 space-y-2">
                  <div className="relative">
                    <input
                      type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitReply(); } }}
                      placeholder={`Reply to ${rev.userName}…`}
                      className="w-full clay-input px-4 py-2.5 text-sm pr-12 text-[var(--foreground)] placeholder:text-[var(--brand-muted)]"
                    />
                    <motion.button
                      type="button" onClick={submitReply} disabled={sending || !replyText.trim()}
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-xl bg-[var(--brand-blue)] text-white disabled:opacity-40"
                    >
                      {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    </motion.button>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className={`inline-flex items-center gap-1.5 text-xs text-[var(--brand-muted)] cursor-pointer hover:text-[var(--foreground)] transition-colors px-2.5 py-1.5 rounded-xl border border-[var(--brand-border)] hover:border-[var(--brand-blue)]/40 ${replyImgs.length >= 3 || replyImgUploading ? "opacity-50 pointer-events-none" : ""}`}>
                      <ImagePlus className="w-3.5 h-3.5" /> {replyImgUploading ? "Uploading…" : "Photo"}
                      <input type="file" accept="image/*" multiple className="hidden"
                        disabled={replyImgs.length >= 3 || replyImgUploading}
                        onChange={async (e) => {
                          const files = e.target.files;
                          if (!files?.length || !productId) return;
                          const room = 3 - replyImgs.length;
                          if (room <= 0) return;
                          setReplyImgUploading(true);
                          for (let i = 0; i < Math.min(files.length, room); i++) {
                            const res = await uploadReviewImage(productId, files[i]);
                            if (res?.url) setReplyImgs((p) => [...p, res.url].slice(0, 3));
                          }
                          setReplyImgUploading(false);
                          e.target.value = "";
                        }} />
                    </label>
                    <button type="button" onClick={() => { setReplying(false); setReplyText(""); }}
                      className="text-xs text-[var(--brand-muted)] hover:text-[var(--foreground)] transition-colors px-2">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nested replies */}
      {(rev.replies?.length ?? 0) > 0 && (
        <motion.div
          className="mt-2 space-y-2"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        >
          {(rev.replies ?? []).map((rep) => (
            <ReviewCard key={rep.id} rev={rep} depth={depth + 1} user={user}
              productId={productId} onReaction={onReaction} onReply={onReply}
              reactionLoadingId={reactionLoadingId} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

/* ─── Page ── */
export default function ProductDetailPage() {
  const params  = useParams();
  const { formatPrice } = useCurrency();
  const router  = useRouter();
  const pathname = usePathname();
  const id      = typeof params.id === "string" ? params.id : "";
  const { user } = useAuth();
  const signInToContinue = () => router.push(getLoginHref(pathname ?? `/dashboard/product/${id}`));
  const t       = useTranslations("offers");
  const tChat   = useTranslations("chat");
  const tDB     = useTranslations("dashboard");

  const [data,              setData]              = useState<ProductDetailResponse | null>(null);
  const [loading,           setLoading]           = useState(true);
  const [liked,             setLiked]             = useState(false);
  const [likeCount,         setLikeCount]         = useState(0);
  const [reviewRating,      setReviewRating]      = useState(0);
  const [reviewComment,     setReviewComment]     = useState("");
  const [reviewImageUrls,   setReviewImageUrls]   = useState<string[]>([]);
  const [reviewImgUploading,setReviewImgUploading]= useState(false);
  const [submittingReview,  setSubmittingReview]  = useState(false);
  const [reactionLoadingId, setReactionLoadingId] = useState<string | null>(null);
  const [addingToCart,      setAddingToCart]      = useState(false);
  const [cartQty,           setCartQty]           = useState(1);
  const [cartToast,         setCartToast]         = useState({ show: false, message: "" });
  const [actionToast,       setActionToast]       = useState({ show: false, message: "", isError: false });
  const [myOffer,           setMyOffer]           = useState<{ id: string; status: string } | null>(null);
  const [offerPrice,        setOfferPrice]        = useState("");
  const [offerMessage,      setOfferMessage]      = useState("");
  const [submittingOffer,   setSubmittingOffer]   = useState(false);
  const [startingChat,      setStartingChat]      = useState(false);

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const res = await getProductById(id);
    setData(res);
    if (res) { setLiked(res.userLiked); setLikeCount(res.likeCount); }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

  useEffect(() => {
    if (!id || !user || !data?.product || user.id === data.product.sellerId) { setMyOffer(null); return; }
    let cancelled = false;
    (async () => {
      const list = await listOffers({ asSeller: false });
      if (cancelled) return;
      const ex = list.find((o) => o.productId === id);
      setMyOffer(ex ? { id: ex.id, status: ex.status } : null);
    })();
    return () => { cancelled = true; };
  }, [id, user?.id, data?.product?.sellerId]);

  const handleSubmitOffer = async () => {
    if (!user) { signInToContinue(); return; }
    if (!id) return;
    const price = parseFloat(offerPrice);
    if (Number.isNaN(price) || price < 0) { setActionToast({ show: true, message: "Enter a valid price.", isError: true }); return; }
    setSubmittingOffer(true);
    const result = await createOffer(id, price, offerMessage || undefined);
    setSubmittingOffer(false);
    if (result.success) {
      setMyOffer({ id: result.offer.id, status: result.offer.status });
      setOfferPrice(""); setOfferMessage("");
      setActionToast({ show: true, message: "Offer sent!", isError: false });
    } else { setActionToast({ show: true, message: result.error, isError: true }); }
  };

  const handleMessageSeller = async () => {
    if (!user) { signInToContinue(); return; }
    if (!id) return;
    setStartingChat(true);
    const result = await createConversationByProduct(id);
    setStartingChat(false);
    if (result.success) { if (result.conversation.id) router.push(`/dashboard/chat/${result.conversation.id}`); }
    else setActionToast({ show: true, message: result.error, isError: true });
  };

  const handleLike = async () => {
    if (!user) { signInToContinue(); return; }
    if (!id) return;
    const result = await toggleProductLike(id);
    if (result) { setLiked(result.liked); setLikeCount(result.likeCount); }
  };

  const handleSubmitReview = async () => {
    if (!id || reviewRating < 1) return;
    setSubmittingReview(true);
    const ok = await addProductReview(id, reviewRating, reviewComment || undefined, undefined, reviewImageUrls.length ? reviewImageUrls : undefined);
    setSubmittingReview(false);
    if (ok?.success) { setReviewRating(0); setReviewComment(""); setReviewImageUrls([]); fetchProduct(); }
  };

  const handleReplySubmit = async (parentId: string, comment: string, images: string[]) => {
    if (!id || !comment.trim()) return;
    const ok = await addProductReview(id, 0, comment.trim(), parentId, images.length ? images : undefined);
    if (ok?.success) fetchProduct();
  };

  const handleReaction = async (reviewId: string, type: "like" | "dislike") => {
    if (!id) return;
    setReactionLoadingId(reviewId);
    await addReviewReaction(id, reviewId, type);
    setReactionLoadingId(null);
    fetchProduct();
  };

  const handleReviewImageSelect = async (e: React.ChangeEvent<HTMLInputElement>, setUrls: React.Dispatch<React.SetStateAction<string[]>>) => {
    const files = e.target.files;
    if (!files?.length || !id) return;
    setReviewImgUploading(true);
    const urls: string[] = [];
    for (let i = 0; i < Math.min(files.length, 3); i++) {
      const res = await uploadReviewImage(id, files[i]);
      if (res?.url) urls.push(res.url);
    }
    setUrls((prev) => [...prev, ...urls].slice(0, 3));
    setReviewImgUploading(false);
    e.target.value = "";
  };

  const handleAddToCart = async () => {
    if (!user) { signInToContinue(); return; }
    if (!id || !data?.product) return;
    setAddingToCart(true);
    const result = await addToCart(id, cartQty);
    setAddingToCart(false);
    if (result.success) setCartToast({ show: true, message: `${result.productName ?? data.product.name} added to cart` });
  };

  const handleBuyNow = async () => {
    if (!user) { signInToContinue(); return; }
    if (!id || !data?.product) return;
    setAddingToCart(true);
    const result = await addToCart(id, cartQty);
    setAddingToCart(false);
    if (result.success) router.push("/dashboard/checkout");
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-5 w-28 rounded-full bg-[var(--brand-border)] loading-shimmer-bar opacity-40" />
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="aspect-square clay-card loading-shimmer-bar opacity-30" style={{ padding: 0 }} />
          <div className="space-y-4 py-4">
            {[180, 100, 60, 140, 80, 200].map((w, i) => (
              <div key={i} className="h-5 rounded-xl bg-[var(--brand-border)] loading-shimmer-bar opacity-30" style={{ width: w }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="clay-card p-16 text-center">
        <Package className="mx-auto w-12 h-12 text-[var(--brand-muted)]/30 mb-4" />
        <p className="font-bold text-[var(--foreground)] mb-5">Product not found</p>
        <Link href="/dashboard/browse" className="clay-btn-blue px-5 py-2.5 text-sm inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Browse
        </Link>
      </motion.div>
    );
  }

  const { reviews, reviewCount, averageRating } = data;

  /* Rating distribution */
  const ratingDist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => { if (r.rating && r.rating >= 1 && r.rating <= 5) ratingDist[r.rating]++; });

  const reviewsBlock = (
    <section className="space-y-6">
        {/* Rating summary */}
        <div className="clay-card p-6">
          <h2 className="text-xl font-black text-[var(--foreground)] mb-5">Customer Reviews</h2>
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            {/* Big number */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <span className="text-6xl font-black text-[var(--foreground)]">
                {averageRating > 0 ? averageRating.toFixed(1) : "—"}
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((r) => (
                  <motion.div key={r} initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ delay: 0.1 + r * 0.07, type: "spring", stiffness: 500 }}>
                    <Star className={`w-5 h-5 ${averageRating >= r ? "text-amber-400 fill-amber-400" : "text-[var(--brand-border)]"}`} />
                  </motion.div>
                ))}
              </div>
              <span className="text-xs text-[var(--brand-muted)]">{reviewCount} review{reviewCount !== 1 ? "s" : ""}</span>
            </div>
            {/* Bar chart */}
            <div className="flex-1 space-y-2 w-full">
              {[5, 4, 3, 2, 1].map((star) => (
                <RatingBar key={star} star={star} count={ratingDist[star] ?? 0} total={reviewCount} />
              ))}
            </div>
          </div>
        </div>

        {/* Write a review */}
        {user ? (
        <div className="clay-card p-6 space-y-5">
          <h3 className="font-bold text-[var(--foreground)] flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" /> Write a Review
          </h3>
          <div className="space-y-4">
            <StarPicker value={reviewRating} onChange={setReviewRating} />
            <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your experience — what did you love or what could be better?"
              rows={3}
              className="clay-input w-full px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--brand-muted)] resize-none"
            />
            {/* Photo upload */}
            <div className="flex flex-wrap items-center gap-3">
              <label className={`inline-flex items-center gap-2 clay-card px-3.5 py-2 text-xs font-semibold cursor-pointer hover:text-[var(--foreground)] transition-colors rounded-2xl ${reviewImageUrls.length >= 3 ? "opacity-50 cursor-not-allowed" : ""}`}>
                <ImagePlus className="w-4 h-4 text-[var(--brand-blue)]" />
                {reviewImgUploading ? "Uploading…" : "Add photo"}
                <input type="file" accept="image/*" multiple className="hidden"
                  disabled={reviewImageUrls.length >= 3 || reviewImgUploading}
                  onChange={(e) => handleReviewImageSelect(e, setReviewImageUrls)} />
              </label>
              <AnimatePresence>
                {reviewImageUrls.map((url) => (
                  <motion.div key={url} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    className="relative w-16 h-16 rounded-2xl overflow-hidden border border-[var(--brand-border)]">
                    <Image src={url} alt="" fill className="object-cover" sizes="64px" />
                    <button type="button" onClick={() => setReviewImageUrls((p) => p.filter((u) => u !== url))}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/80 flex items-center justify-center text-white hover:bg-black transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <motion.button type="button" onClick={handleSubmitReview}
              disabled={submittingReview || reviewRating < 1}
              whileHover={!(submittingReview || reviewRating < 1) ? { scale: 1.03, y: -1 } : {}}
              whileTap={!(submittingReview || reviewRating < 1) ? { scale: 0.96 } : {}}
              className="rounded-2xl bg-amber-500 px-7 py-3 text-sm font-bold text-black disabled:opacity-40 flex items-center gap-2"
              style={{ boxShadow: reviewRating >= 1 ? "0 4px 16px rgba(245,158,11,0.35)" : "none" }}
            >
              {submittingReview
                ? <><motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}><Loader2 className="w-4 h-4" /></motion.span> Submitting…</>
                : <><Send className="w-4 h-4" /> Submit Review</>
              }
            </motion.button>
          </div>
        </div>
        ) : (
          <div className="clay-card p-6 text-center space-y-3">
            <p className="font-bold text-[var(--foreground)]">Sign in to write a review</p>
            <p className="text-sm text-[var(--brand-muted)]">Browse freely — create an account to share your experience.</p>
            <button type="button" onClick={signInToContinue} className="clay-btn-blue px-6 py-2.5 text-sm inline-flex">
              Sign in
            </button>
          </div>
        )}

        {/* Review list — social feed style */}
        {reviews.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="clay-card p-12 text-center">
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              <MessageSquare className="mx-auto w-12 h-12 text-[var(--brand-muted)]/25 mb-4" />
            </motion.div>
            <p className="font-bold text-[var(--foreground)] mb-1">No reviews yet</p>
            <p className="text-sm text-[var(--brand-muted)]">Be the first to share your thoughts</p>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-3"
            initial="hidden" animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          >
            {reviews.map((rev) => (
              <ReviewCard key={rev.id} rev={rev} user={user} productId={id}
                onReaction={handleReaction} onReply={handleReplySubmit}
                reactionLoadingId={reactionLoadingId} />
            ))}
          </motion.div>
        )}
    </section>
  );

  return (
    <>
      <Toast message={cartToast.message} visible={cartToast.show} onDismiss={() => setCartToast((p) => ({ ...p, show: false }))} duration={3500} />
      <Toast message={actionToast.message} visible={actionToast.show} onDismiss={() => setActionToast((p) => ({ ...p, show: false }))} duration={actionToast.isError ? 5000 : 3500} variant={actionToast.isError ? "error" : "success"} />
      <ProductDetailMarketView
        data={data}
        user={user}
        liked={liked}
        likeCount={likeCount}
        onLike={handleLike}
        myOffer={myOffer}
        offerPrice={offerPrice}
        offerMessage={offerMessage}
        onOfferPrice={setOfferPrice}
        onOfferMessage={setOfferMessage}
        onSubmitOffer={handleSubmitOffer}
        submittingOffer={submittingOffer}
        onMessageSeller={handleMessageSeller}
        startingChat={startingChat}
        addingToCart={addingToCart}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        onSignInRequired={signInToContinue}
        reviewsSection={reviewsBlock}
      />
    </>
  );
}
