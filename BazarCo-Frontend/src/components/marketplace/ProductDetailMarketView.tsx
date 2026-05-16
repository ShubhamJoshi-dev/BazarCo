"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  ChevronRight,
  HandCoins,
  Heart,
  ImageIcon,
  Loader2,
  MessageSquare,
  Package,
  ShieldCheck,
  ShoppingCart,
  Play,
  Star,
  Truck,
} from "lucide-react";
import type { Product } from "@/types/api";
import type { ProductDetailResponse } from "@/lib/api";
import { browseProducts } from "@/lib/api";
import { useCurrency } from "@/contexts/CurrencyContext";
import { compareAtPrice, discountPercent, pseudoRating, pseudoReviews } from "@/lib/marketplaceUi";
import { StarRatingDisplay } from "@/components/marketplace/StarRatingDisplay";
import type { ReactNode } from "react";

type Props = {
  data: ProductDetailResponse;
  user: { id: string } | null;
  liked: boolean;
  likeCount: number;
  onLike: () => void;
  myOffer: { id: string; status: string } | null;
  offerPrice: string;
  offerMessage: string;
  onOfferPrice: (v: string) => void;
  onOfferMessage: (v: string) => void;
  onSubmitOffer: () => void;
  submittingOffer: boolean;
  onMessageSeller: () => void;
  startingChat: boolean;
  addingToCart: boolean;
  onAddToCart: () => void;
  onBuyNow: () => void;
  reviewsSection: ReactNode;
};

export function ProductDetailMarketView({
  data,
  user,
  liked,
  likeCount,
  onLike,
  myOffer,
  offerPrice,
  offerMessage,
  onOfferPrice,
  onOfferMessage,
  onSubmitOffer,
  submittingOffer,
  onMessageSeller,
  startingChat,
  addingToCart,
  onAddToCart,
  onBuyNow,
  reviewsSection,
}: Props) {
  const t = useTranslations("productDetail");
  const tReels = useTranslations("productReels");
  const tOffers = useTranslations("offers");
  const tChat = useTranslations("chat");
  const tDB = useTranslations("dashboard");
  const { formatPrice } = useCurrency();
  const { product, reviewCount, averageRating, sellerKycVerified } = data;
  const [related, setRelated] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);

  const images = product.imageUrl ? [product.imageUrl] : [];
  const price = Number(product.price);
  const original = compareAtPrice(price);
  const off = discountPercent(price, original);
  const displayRating = averageRating > 0 ? averageRating : pseudoRating(product.id);
  const displayReviews = reviewCount > 0 ? reviewCount : pseudoReviews(product.id);
  const avgBargain = Math.round(price * 0.94);

  const isBuyer = user && user.id !== product.sellerId;

  useEffect(() => {
    browseProducts({
      category: product.categoryId,
      limit: 4,
    }).then((res) => {
      setRelated(res.products.filter((p) => p.id !== product.id).slice(0, 4));
    });
  }, [product.id, product.categoryId]);

  const specs = [
    { label: t("specCategory"), value: product.category ?? "—" },
    { label: t("specBrand"), value: product.brand ?? "—" },
    { label: t("specSku"), value: product.sku ?? "—" },
    { label: t("specStock"), value: product.stock != null ? String(product.stock) : "—" },
  ];

  const boxIncludes = [
    product.name,
    t("boxWarranty"),
    t("boxCable"),
  ];

  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-10 pb-12">
      <nav className="text-xs text-[var(--brand-muted)]" aria-label="Breadcrumb">
        <Link href="/dashboard" className="hover:text-[var(--foreground)]">{t("breadcrumbHome")}</Link>
        <span className="mx-1.5">/</span>
        <Link href="/dashboard/browse" className="hover:text-[var(--foreground)]">{t("breadcrumbBrowse")}</Link>
        {product.category && (
          <>
            <span className="mx-1.5">/</span>
            <span className="text-[var(--foreground)]">{product.category}</span>
          </>
        )}
      </nav>

      {/* Hero */}
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200">
            {images[selectedImage] ? (
              <Image
                src={images[selectedImage]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width:1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <ImageIcon className="absolute inset-0 m-auto h-20 w-20 text-neutral-300" />
            )}
          </div>
          {images.length > 0 && (
            <div className="flex gap-2 mt-3">
              {images.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setSelectedImage(i)}
                  className={`relative h-16 w-16 rounded-lg overflow-hidden border-2 ${
                    selectedImage === i ? "border-[var(--brand-red)]" : "border-neutral-200"
                  }`}
                >
                  <Image src={url} alt="" fill className="object-cover" sizes="64px" />
                </button>
              ))}
              {images.length === 1 && (
                <span className="flex items-center justify-center h-16 px-3 rounded-lg border border-dashed border-neutral-300 text-xs text-neutral-500">
                  +4 {t("morePhotos")}
                </span>
              )}
            </div>
          )}
          {isBuyer && (
            <Link
              href={`/dashboard/reels?product=${product.id}`}
              className="mt-3 flex items-center justify-center gap-2 w-full rounded-xl bg-[var(--brand-red)] text-white py-3 text-sm font-bold hover:bg-[#b71c1c] transition-colors shadow-sm"
            >
              <Play className="h-5 w-5 fill-white" />
              {tReels("watchReel")}
            </Link>
          )}
        </div>

        {/* Purchase panel */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-[var(--brand-red)]/10 text-[var(--brand-red)] text-[10px] font-bold uppercase px-2.5 py-1">
              {t("bestseller")}
            </span>
            {product.category && (
              <span className="rounded-full bg-sky-100 text-sky-700 text-[10px] font-bold uppercase px-2.5 py-1">
                {product.category}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black leading-tight">{product.name}</h1>

          <div className="flex flex-wrap items-center gap-3">
            <StarRatingDisplay rating={displayRating} showValue reviewCount={displayReviews} />
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> {t("inStock")}
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-black text-[var(--brand-red)]">{formatPrice(price)}</span>
            <span className="text-lg text-neutral-400 line-through">{formatPrice(original)}</span>
            {off > 0 && (
              <span className="rounded-md bg-[var(--brand-red)]/10 text-[var(--brand-red)] text-xs font-bold px-2 py-1">
                {off}% {t("off")}
              </span>
            )}
          </div>

          {isBuyer && (
            <div id="offer" className="rounded-xl border border-sky-200 bg-sky-50/80 dark:bg-sky-950/30 p-4 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-sky-800 dark:text-sky-200">
                <HandCoins className="h-4 w-4" /> {tOffers("makeOffer")}
              </h3>
              {myOffer ? (
                <p className="text-sm text-[var(--brand-muted)]">
                  {tOffers("youHaveOffer")}{" "}
                  <Link href="/dashboard/offers" className="text-[var(--brand-red)] font-semibold hover:underline">
                    {tOffers("myOffers")}
                  </Link>
                </p>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder={t("offerPlaceholder")}
                      value={offerPrice}
                      onChange={(e) => onOfferPrice(e.target.value)}
                      className="flex-1 rounded-lg border border-sky-200 bg-white px-3 py-2.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={onSubmitOffer}
                      disabled={submittingOffer || !offerPrice.trim()}
                      className="shrink-0 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                    >
                      {submittingOffer ? <Loader2 className="h-4 w-4 animate-spin" /> : t("submitOffer")}
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder={t("offerMessageOptional")}
                    value={offerMessage}
                    onChange={(e) => onOfferMessage(e.target.value)}
                    className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-sky-700/80">{t("avgBargain", { price: formatPrice(avgBargain) })}</p>
                </>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onBuyNow}
              disabled={addingToCart}
              className="flex-1 rounded-xl bg-[var(--brand-red)] py-3.5 text-sm font-bold text-white hover:bg-[#b71c1c] disabled:opacity-60"
            >
              {t("buyNow")}
            </button>
            <button
              type="button"
              onClick={onAddToCart}
              disabled={addingToCart}
              className="flex-1 rounded-xl border-2 border-[var(--brand-red)] py-3.5 text-sm font-bold text-[var(--brand-red)] hover:bg-[var(--brand-red)]/5 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {addingToCart ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
              {t("addToCart")}
            </button>
            <button
              type="button"
              onClick={onLike}
              className="rounded-xl border border-neutral-200 p-3.5 hover:bg-neutral-50"
              aria-label={liked ? t("unlike") : t("like")}
            >
              <Heart className={`h-5 w-5 ${liked ? "fill-[var(--brand-red)] text-[var(--brand-red)]" : ""}`} />
              <span className="sr-only">{likeCount}</span>
            </button>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50/80 dark:bg-neutral-900/40 p-4">
            <Truck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">{t("freeDelivery")}</p>
              <p className="text-xs text-[var(--brand-muted)] mt-0.5">{t("deliveryHint")}</p>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">{product.brand ?? t("officialSeller")}</p>
              <p className="text-xs text-[var(--brand-muted)] flex items-center gap-1 mt-0.5">
                {sellerKycVerified && <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />}
                {sellerKycVerified ? tDB("verifiedSeller") : t("sellerFeedback")}
              </p>
            </div>
            {isBuyer && (
              <button
                type="button"
                onClick={onMessageSeller}
                disabled={startingChat}
                className="text-sm font-semibold text-[var(--brand-red)] hover:underline flex items-center gap-1 shrink-0"
              >
                {startingChat ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                {tChat("messageSeller")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Description + specs */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-4">
          <h2 className="text-lg font-bold">{t("description")}</h2>
          <div className="rounded-xl border border-neutral-200 p-5 prose prose-sm max-w-none dark:prose-invert">
            {product.description ? (
              <p className="text-[var(--brand-muted)] leading-relaxed whitespace-pre-wrap">{product.description}</p>
            ) : (
              <p className="text-[var(--brand-muted)]">{t("noDescription")}</p>
            )}
            {(product.tags?.length ?? 0) > 0 && (
              <ul className="mt-4 list-disc pl-5 space-y-1 text-sm">
                {product.tags!.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-neutral-200 p-5">
            <h3 className="text-sm font-bold mb-4">{t("technicalSpecs")}</h3>
            <dl className="space-y-2.5">
              {specs.map((s) => (
                <div key={s.label} className="flex justify-between gap-2 text-sm">
                  <dt className="text-[var(--brand-muted)]">{s.label}</dt>
                  <dd className="font-medium text-right">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-xl border border-neutral-200 p-5">
            <h3 className="text-sm font-bold mb-3">{t("boxIncludes")}</h3>
            <ul className="text-sm space-y-1.5 list-disc pl-4 text-[var(--brand-muted)]">
              {boxIncludes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {reviewsSection}

      {related.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">{t("youMayLike")}</h2>
            <Link href="/dashboard/browse" className="text-sm text-[var(--brand-red)] font-medium flex items-center gap-0.5">
              {t("viewAll")} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/product/${p.id}`}
                className="rounded-xl border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow bg-white dark:bg-[var(--card-bg)]"
              >
                <div className="relative aspect-square bg-neutral-100">
                  {p.imageUrl ? (
                    <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="25vw" />
                  ) : (
                    <ImageIcon className="absolute inset-0 m-auto h-8 w-8 text-neutral-300" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold line-clamp-2">{p.name}</p>
                  <p className="text-sm font-bold text-[var(--brand-red)] mt-1">{formatPrice(Number(p.price))}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
