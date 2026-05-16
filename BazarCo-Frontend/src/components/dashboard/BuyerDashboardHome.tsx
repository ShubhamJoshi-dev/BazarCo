"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ChevronRight,
  Heart,
  ImageIcon,
  Laptop,
  Package,
  Plus,
  Shirt,
  ShoppingCart,
  Sparkles,
  UtensilsCrossed,
  Home,
  Gem,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Category, Product } from "@/types/api";
import type { Offer, Order } from "@/lib/api";
import {
  addToCart,
  browseProducts,
  categoriesList,
  favouriteAdd,
  favouriteCheck,
  favouriteRemove,
  listOffers,
  listOrders,
} from "@/lib/api";
import { useCurrency } from "@/contexts/CurrencyContext";

function categoryIcon(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (n.includes("elect") || n.includes("tech") || n.includes("computer")) return Laptop;
  if (n.includes("fashion") || n.includes("cloth") || n.includes("wear")) return Shirt;
  if (n.includes("food") || n.includes("grocery") || n.includes("kitchen")) return UtensilsCrossed;
  if (n.includes("home") || n.includes("decor")) return Home;
  if (n.includes("jewel") || n.includes("gift")) return Gem;
  return Package;
}

function compareAt(price: number) {
  return Math.round(price * 1.15 * 100) / 100;
}

type OrderStatusKey = "delivered" | "inTransit" | "processing" | "paid" | "cancelled" | "other";

function orderStatusKey(status: string): OrderStatusKey {
  const s = status.toLowerCase();
  if (s === "delivered" || s === "completed") return "delivered";
  if (s === "shipped" || s === "in_transit" || s === "in transit" || s === "in_progress") return "inTransit";
  if (s === "paid") return "paid";
  if (s === "processing" || s === "pending" || s === "confirmed") return "processing";
  if (s === "cancelled") return "cancelled";
  return "other";
}

function statusDotClass(key: OrderStatusKey) {
  if (key === "delivered") return "bg-emerald-500 ring-4 ring-emerald-100";
  if (key === "inTransit") return "bg-amber-500 ring-4 ring-amber-100";
  if (key === "paid") return "bg-sky-500 ring-4 ring-sky-100";
  if (key === "processing") return "bg-sky-400 ring-4 ring-sky-50";
  if (key === "cancelled") return "bg-neutral-400 ring-4 ring-neutral-100";
  return "bg-neutral-400 ring-4 ring-neutral-100";
}

function statusBadgeClass(key: OrderStatusKey) {
  if (key === "delivered") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (key === "inTransit") return "bg-amber-50 text-amber-800 border-amber-200";
  if (key === "paid") return "bg-sky-50 text-sky-800 border-sky-200";
  if (key === "processing") return "bg-sky-50/80 text-sky-700 border-sky-100";
  if (key === "cancelled") return "bg-neutral-100 text-neutral-600 border-neutral-200";
  return "bg-neutral-100 text-neutral-600 border-neutral-200";
}

function offerStatusLabel(status: Offer["status"], t: (k: string) => string) {
  if (status === "accepted") return t("bargainAgreed");
  if (status === "pending" || status === "countered") return t("bargainPending");
  return status;
}

export function BuyerDashboardHome() {
  const t = useTranslations("buyerDashboard");
  const tCommon = useTranslations("common");
  const { formatPrice } = useCurrency();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [cats, browse, newest, offerList, orderList] = await Promise.all([
        categoriesList(),
        browseProducts({ limit: 8 }),
        browseProducts({ sortBy: "newest", limit: 4 }),
        listOffers({ asSeller: false }),
        listOrders(),
      ]);
      if (cancelled) return;
      setCategories(cats.slice(0, 6));
      setRecommended(browse.products);
      setNewArrivals(newest.products);
      setOffers(offerList.filter((o) => o.status === "pending" || o.status === "accepted" || o.status === "countered").slice(0, 4));
      setOrders(orderList.slice(0, 4));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8 w-full max-w-[1400px] mx-auto">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d1f3c] via-[#132a52] to-[#1a3a6e] px-6 py-8 sm:px-10 sm:py-10 text-white shadow-lg">
        <div className="relative z-10 max-w-xl">
          <span className="inline-block rounded-full bg-[var(--brand-red)] px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest mb-3">
            {t("heroTag")}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{t("heroTitle")}</h1>
          <p className="mt-2 text-sm sm:text-base text-white/80 leading-relaxed">{t("heroDesc")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard/browse?flash=1"
              className="inline-flex items-center rounded-xl bg-[var(--brand-red)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#b71c1c] transition-colors"
            >
              {t("shopDeals")}
            </Link>
            <Link
              href="/dashboard/browse?sort=new"
              className="inline-flex items-center rounded-xl border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              {t("viewTrends")}
            </Link>
          </div>
        </div>
        <Sparkles className="absolute right-6 top-6 h-16 w-16 text-white/10 hidden sm:block" />
      </section>

      {/* Categories */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[var(--foreground)]">{t("exploreCategories")}</h2>
          <Link href="/dashboard/browse" className="text-sm font-medium text-[var(--brand-red)] hover:underline flex items-center gap-0.5">
            {t("viewAll")}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {(loading && categories.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-neutral-100 animate-pulse" />
              ))
            : categories.map((cat) => {
                const Icon = categoryIcon(cat.name);
                return (
                  <Link
                    key={cat.id}
                    href={`/dashboard/browse?category=${cat.id}`}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white dark:bg-[var(--card-bg)] p-4 hover:border-[var(--brand-red)]/30 hover:shadow-md transition-all"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand-red)]/10 text-[var(--brand-red)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-semibold text-center line-clamp-2">{cat.name}</span>
                  </Link>
                );
              }))}
        </div>
      </section>

      {/* Recommended + widgets */}
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">{t("recommended")}</h2>
            <Link href="/dashboard/browse" className="text-sm font-medium text-[var(--brand-red)] hover:underline">
              {t("viewAll")}
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-neutral-200 overflow-hidden animate-pulse">
                  <div className="aspect-square bg-neutral-100" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-neutral-100 rounded w-3/4" />
                    <div className="h-3 bg-neutral-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : recommended.length === 0 ? (
            <p className="text-sm text-[var(--brand-muted)]">{t("noProducts")}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {recommended.map((p) => (
                <HomeProductCard key={p.id} product={p} formatPrice={formatPrice} t={t} tCommon={tCommon} router={router} />
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          {/* Active bargains */}
          <div className="rounded-xl border border-neutral-200 bg-white dark:bg-[var(--card-bg)] p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold">{t("activeBargains")}</h3>
              <Link
                href="/dashboard/offers"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-red)] text-white hover:bg-[#b71c1c]"
                aria-label={t("newBargain")}
              >
                <Plus className="h-4 w-4" />
              </Link>
            </div>
            {offers.length === 0 ? (
              <p className="text-xs text-[var(--brand-muted)]">{t("noBargains")}</p>
            ) : (
              <ul className="space-y-3">
                {offers.map((o) => (
                  <li key={o.id}>
                    <Link href={`/dashboard/product/${o.productId}`} className="flex gap-2 group">
                      <div className="relative h-10 w-10 shrink-0 rounded-lg bg-neutral-100 overflow-hidden">
                        {o.product?.imageUrl ? (
                          <Image src={o.product.imageUrl} alt="" fill className="object-cover" sizes="40px" />
                        ) : (
                          <ImageIcon className="absolute inset-0 m-auto h-4 w-4 text-neutral-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate group-hover:text-[var(--brand-red)]">
                          {o.product?.name ?? t("product")}
                        </p>
                        <p className="text-[10px] text-[var(--brand-muted)]">
                          {formatPrice(o.proposedPrice)}
                          <span className="mx-1">·</span>
                          <span className={o.status === "accepted" ? "text-emerald-600 font-medium" : ""}>
                            {offerStatusLabel(o.status, t)}
                          </span>
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Order status timeline */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[var(--foreground)]">{t("orderStatus")}</h3>
              <Link
                href="/dashboard/orders"
                className="text-xs font-semibold text-[var(--brand-red)] hover:underline"
              >
                {t("viewAll")}
              </Link>
            </div>
            {orders.length === 0 ? (
              <p className="text-xs text-[var(--brand-muted)]">{t("noOrders")}</p>
            ) : (
              <ul className="space-y-0 list-none">
                {orders.map((order, i) => {
                  const key = orderStatusKey(order.status);
                  const label = t(`status_${key}`);
                  const item = order.items[0];
                  const itemCount = order.items.length;
                  return (
                    <li key={order.id} className="flex gap-3">
                      <div className="flex flex-col items-center pt-1">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusDotClass(key)}`} />
                        {i < orders.length - 1 && (
                          <span className="w-0.5 flex-1 min-h-[2.5rem] bg-neutral-200 mt-1.5" />
                        )}
                      </div>
                      <div className={`min-w-0 flex-1 ${i < orders.length - 1 ? "pb-4" : ""}`}>
                        <p className="text-xs font-semibold text-[var(--foreground)] truncate">
                          {item?.productName ?? t("orderItems")}
                          {itemCount > 1 ? ` +${itemCount - 1}` : ""}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadgeClass(key)}`}
                          >
                            {label}
                          </span>
                          <span className="text-[10px] font-semibold text-[var(--brand-muted)] tabular-nums">
                            {formatPrice(Number(order.total))}
                          </span>
                        </div>
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="text-[10px] font-semibold text-[var(--brand-red)] hover:underline mt-1.5 inline-block"
                        >
                          {t("viewOrder")} →
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>

      {/* New arrivals */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{t("newArrivals")}</h2>
          <Link href="/dashboard/browse?sort=new" className="text-sm font-medium text-[var(--brand-red)] hover:underline">
            {t("viewAll")}
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {newArrivals.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/product/${p.id}`}
              className="rounded-xl border border-neutral-200 bg-white dark:bg-[var(--card-bg)] overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-[4/3] bg-neutral-100">
                {p.imageUrl ? (
                  <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="(max-width:640px) 50vw, 25vw" />
                ) : (
                  <ImageIcon className="absolute inset-0 m-auto h-8 w-8 text-neutral-300" />
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold line-clamp-1">{p.name}</p>
                <p className="text-sm font-bold text-[var(--brand-red)] mt-0.5">{formatPrice(Number(p.price))}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function HomeProductCard({
  product,
  formatPrice,
  t,
  tCommon,
  router,
}: {
  product: Product;
  formatPrice: (n: number) => string;
  t: (k: string) => string;
  tCommon: (k: string) => string;
  router: ReturnType<typeof useRouter>;
}) {
  const [favourited, setFavourited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const price = Number(product.price);
  const original = compareAt(price);

  useEffect(() => {
    favouriteCheck(product.id).then(setFavourited);
  }, [product.id]);

  const toggleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (favLoading) return;
    setFavLoading(true);
    const ok = favourited ? await favouriteRemove(product.id) : await favouriteAdd(product.id);
    setFavLoading(false);
    if (ok) setFavourited(!favourited);
  };

  const handleCart = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (cartLoading) return;
      setCartLoading(true);
      const result = await addToCart(product.id, 1);
      setCartLoading(false);
      if (result.success) router.push("/dashboard/cart");
    },
    [cartLoading, product.id, router],
  );

  return (
    <article className="rounded-xl border border-neutral-200 bg-white dark:bg-[var(--card-bg)] overflow-hidden hover:shadow-md transition-shadow group">
      <Link href={`/dashboard/product/${product.id}`} className="block">
        <div className="relative aspect-square bg-neutral-100">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="(max-width:640px) 50vw, 25vw" />
          ) : (
            <ImageIcon className="absolute inset-0 m-auto h-10 w-10 text-neutral-300" />
          )}
          <button
            type="button"
            onClick={toggleFav}
            disabled={favLoading}
            className="absolute top-2 right-2 rounded-full bg-white/90 p-1.5 shadow hover:scale-105 transition-transform"
            aria-label={favourited ? t("removeFavorite") : t("addFavorite")}
          >
            <Heart className={`h-4 w-4 ${favourited ? "fill-[var(--brand-red)] text-[var(--brand-red)]" : "text-neutral-500"}`} />
          </button>
        </div>
        <div className="p-3">
          <p className="text-sm font-semibold line-clamp-2 min-h-[2.5rem] leading-snug">{product.name}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-sm font-bold text-[var(--brand-red)]">{formatPrice(price)}</span>
            <span className="text-xs text-neutral-400 line-through">{formatPrice(original)}</span>
          </div>
        </div>
      </Link>
      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={handleCart}
          disabled={cartLoading}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[var(--brand-red)] py-2 text-xs font-semibold text-white hover:bg-[#b71c1c] disabled:opacity-60"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          {tCommon("addToCart")}
        </button>
        <Link
          href={`/dashboard/product/${product.id}#bargain`}
          className="mt-2 block w-full text-center text-[10px] font-medium text-[var(--brand-muted)] hover:text-[var(--brand-red)]"
        >
          {t("checkBargain")}
        </Link>
      </div>
    </article>
  );
}
