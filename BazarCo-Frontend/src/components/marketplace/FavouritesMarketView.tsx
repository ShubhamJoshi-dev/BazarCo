"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Filter,
  Heart,
  Home,
  ImageIcon,
  Laptop,
  Plus,
  Share2,
  ShoppingCart,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Product } from "@/types/api";
import { favouritesList, favouriteRemove, addToCart } from "@/lib/api";
import { useCurrency } from "@/contexts/CurrencyContext";

type SortKey = "newest" | "price-asc" | "price-desc" | "name";

type Collection = {
  id: string;
  label: string;
  count: number;
  Icon: LucideIcon;
  iconClass: string;
};

function categoryIcon(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (n.includes("home") || n.includes("decor")) return Home;
  if (n.includes("elect") || n.includes("tech")) return Laptop;
  return Heart;
}

function iconClassFor(id: string) {
  if (id === "all") return "bg-red-100 text-red-600";
  if (id.startsWith("cat-0")) return "bg-blue-100 text-blue-600";
  if (id.startsWith("cat-1")) return "bg-emerald-100 text-emerald-700";
  return "bg-violet-100 text-violet-700";
}

export function FavouritesMarketView() {
  const t = useTranslations("favouritesPage");
  const tCommon = useTranslations("common");
  const { formatPrice } = useCurrency();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [collectionId, setCollectionId] = useState("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [filterOpen, setFilterOpen] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    favouritesList().then((list) => {
      setProducts(list);
      setLoading(false);
    });
  }, []);

  const collections = useMemo((): Collection[] => {
    const byCategory = new Map<string, Product[]>();
    for (const p of products) {
      const key = p.category ?? p.categoryId ?? "other";
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key)!.push(p);
    }
    const cats = Array.from(byCategory.entries()).slice(0, 2);
    const list: Collection[] = [
      { id: "all", label: t("totalCollection"), count: products.length, Icon: Heart, iconClass: "bg-red-100 text-red-600" },
    ];
    cats.forEach(([name, items], i) => {
      list.push({
        id: `cat-${i}-${name}`,
        label: name === "other" ? t("uncategorized") : name,
        count: items.length,
        Icon: categoryIcon(name),
        iconClass: iconClassFor(`cat-${i}`),
      });
    });
    return list;
  }, [products, t]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (collectionId !== "all") {
      const col = collections.find((c) => c.id === collectionId);
      if (col && col.id !== "all") {
        const label = col.label;
        list = list.filter((p) => (p.category ?? t("uncategorized")) === label || p.categoryId === label);
      }
    }
    list.sort((a, b) => {
      if (sort === "price-asc") return Number(a.price) - Number(b.price);
      if (sort === "price-desc") return Number(b.price) - Number(a.price);
      if (sort === "name") return a.name.localeCompare(b.name);
      return 0;
    });
    return list;
  }, [products, collectionId, collections, sort, t]);

  const removeFavourite = async (productId: string) => {
    const ok = await favouriteRemove(productId);
    if (ok) setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleAddToCart = async (productId: string) => {
    setAddingId(productId);
    const res = await addToCart(productId, 1);
    setAddingId(null);
    if (res.success) router.push("/dashboard/cart");
  };

  if (loading) {
    return (
      <div className="w-full max-w-[1200px] mx-auto space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-neutral-200 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-neutral-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)]">{t("title")}</h1>
          <p className="text-sm text-[var(--brand-muted)] mt-1">
            {t("subtitle", { items: products.length, lists: Math.max(1, collections.length) })}
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 text-sky-700 px-4 py-2.5 text-sm font-semibold hover:bg-sky-100 shrink-0"
          onClick={() => alert(t("createListSoon"))}
        >
          <Plus className="h-4 w-4" />
          {t("createList")}
        </button>
      </div>

      {/* Collection cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {collections.map((col) => {
          const active = collectionId === col.id;
          const Icon = col.Icon;
          return (
            <button
              key={col.id}
              type="button"
              onClick={() => setCollectionId(col.id)}
              className={`rounded-xl border p-4 text-left transition-all ${
                active
                  ? "border-[var(--brand-red)] bg-[var(--brand-red)]/5 shadow-md"
                  : "border-neutral-200 bg-white dark:bg-[var(--card-bg)] hover:border-neutral-300 hover:shadow-sm"
              }`}
            >
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${col.iconClass}`}>
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-bold line-clamp-1">{col.label}</p>
              <p className="text-xs text-[var(--brand-muted)]">{t("items", { count: col.count })}</p>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => alert(t("createListSoon"))}
          className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50/50 dark:bg-neutral-900/30 p-4 flex flex-col items-center justify-center gap-2 min-h-[7.5rem] hover:border-[var(--brand-red)]/40 transition-colors"
        >
          <span className="h-10 w-10 rounded-lg border border-neutral-300 flex items-center justify-center">
            <Plus className="h-5 w-5 text-neutral-400" />
          </span>
          <span className="text-sm font-semibold text-[var(--brand-muted)]">{t("addCategory")}</span>
        </button>
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white dark:bg-[var(--card-bg)] p-16 text-center">
          <Heart className="mx-auto h-14 w-14 text-neutral-300 mb-4" />
          <p className="font-bold text-lg mb-1">{t("emptyTitle")}</p>
          <p className="text-sm text-[var(--brand-muted)] mb-6">{t("emptyHint")}</p>
          <Link
            href="/dashboard/browse"
            className="inline-flex rounded-xl bg-[var(--brand-red)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#b71c1c]"
          >
            {t("browseProducts")}
          </Link>
        </div>
      ) : (
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold">{t("recentlySaved")}</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium hover:bg-neutral-50"
              >
                <Filter className="h-4 w-4" />
                {t("filter")}
              </button>
              {filterOpen && (
                <select
                  value={collectionId}
                  onChange={(e) => setCollectionId(e.target.value)}
                  className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                >
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              )}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium"
              >
                <option value="newest">{t("sortNewest")}</option>
                <option value="price-asc">{t("sortPriceAsc")}</option>
                <option value="price-desc">{t("sortPriceDesc")}</option>
                <option value="name">{t("sortName")}</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-[var(--brand-muted)] py-8 text-center">{t("noInCollection")}</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((p) => (
                <article
                  key={p.id}
                  className="rounded-xl border border-neutral-200 bg-white dark:bg-[var(--card-bg)] overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  <div className="relative aspect-[4/3] bg-neutral-100">
                    {p.imageUrl ? (
                      <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="(max-width:768px) 50vw, 25vw" />
                    ) : (
                      <ImageIcon className="absolute inset-0 m-auto h-10 w-10 text-neutral-300" />
                    )}
                    <button
                      type="button"
                      onClick={() => removeFavourite(p.id)}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/95 shadow flex items-center justify-center hover:bg-red-50"
                      aria-label={t("remove")}
                    >
                      <X className="h-4 w-4 text-neutral-600" />
                    </button>
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] text-[var(--brand-muted)] truncate mb-0.5">
                      {p.category ? `${p.category}` : t("uncategorized")}
                    </p>
                    <Link href={`/dashboard/product/${p.id}`}>
                      <h3 className="text-sm font-bold line-clamp-2 min-h-[2.5rem] leading-snug hover:text-[var(--brand-red)]">
                        {p.name}
                      </h3>
                    </Link>
                    <p className="text-base font-bold text-[var(--brand-red)] mt-1">{formatPrice(Number(p.price))}</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={addingId === p.id}
                        onClick={() => handleAddToCart(p.id)}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-[var(--brand-red)] py-2 text-xs font-semibold text-white hover:bg-[#b71c1c] disabled:opacity-60"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        {tCommon("addToCart")}
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-neutral-200 p-2 hover:bg-neutral-50"
                        aria-label={t("share")}
                        onClick={() => {
                          if (navigator.share) {
                            void navigator.share({ title: p.name, url: `${window.location.origin}/dashboard/product/${p.id}` });
                          }
                        }}
                      >
                        <Share2 className="h-4 w-4 text-neutral-500" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
