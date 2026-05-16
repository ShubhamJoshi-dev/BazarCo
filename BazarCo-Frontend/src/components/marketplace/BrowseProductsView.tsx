"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ChevronLeft,
  ChevronRight,
  HandCoins,
  Heart,
  ImageIcon,
  Package,
  Search,
  ShoppingCart,
  Star,
  X,
} from "lucide-react";
import type { Product, Category, Tag } from "@/types/api";
import {
  browseProducts,
  favouriteAdd,
  favouriteCheck,
  favouriteRemove,
  addToCart,
} from "@/lib/api";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  compareAtPrice,
  extractBrands,
  productBadges,
  pseudoRating,
  pseudoReviews,
  type ProductBadge,
} from "@/lib/marketplaceUi";
import { StarRatingDisplay } from "@/components/marketplace/StarRatingDisplay";

const HITS_PER_PAGE = 12;
const SEARCH_DEBOUNCE_MS = 400;

type SortOption = "newest" | "price-asc" | "price-desc" | "name-asc";

function badgeClass(badge: ProductBadge) {
  if (badge === "freeDelivery") return "bg-emerald-500 text-white";
  if (badge === "hotDeal") return "bg-[var(--brand-red)] text-white";
  return "bg-sky-600 text-white";
}

export function BrowseProductsView() {
  const t = useTranslations("browseProducts");
  const tCommon = useTranslations("common");
  const { formatPrice } = useCurrency();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [draftCategory, setDraftCategory] = useState<string | null>(null);
  const [draftMin, setDraftMin] = useState("");
  const [draftMax, setDraftMax] = useState("");
  const [draftRating, setDraftRating] = useState<number | null>(null);
  const [draftBrands, setDraftBrands] = useState<string[]>([]);

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState<number | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [page, setPage] = useState(0);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [total, setTotal] = useState(0);
  const [nbPages, setNbPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const cat = searchParams.get("category");
    const sort = searchParams.get("sort");
    const q = searchParams.get("q") ?? "";
    if (cat) {
      setCategoryId(cat);
      setDraftCategory(cat);
    }
    if (sort === "new") setSortBy("newest");
    setQuery(q);
    setDebouncedQuery(q);
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(0);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const fetchBrowse = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const res = await browseProducts({
      q: debouncedQuery || undefined,
      category: categoryId ?? undefined,
      sortBy,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      page,
      limit: HITS_PER_PAGE,
    });
    setProducts(res.products);
    setCategories(res.categories);
    setTags(res.tags);
    setTotal(res.total);
    setNbPages(res.nbPages);
    if (res.error) setFetchError(res.error);
    setLoading(false);
  }, [debouncedQuery, categoryId, sortBy, minPrice, maxPrice, page]);

  useEffect(() => {
    fetchBrowse();
  }, [fetchBrowse]);

  const brands = useMemo(() => extractBrands(products), [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (minRating != null && pseudoRating(p.id) < minRating) return false;
      if (selectedBrands.length && (!p.brand || !selectedBrands.includes(p.brand))) return false;
      return true;
    });
  }, [products, minRating, selectedBrands]);

  const categoryName =
    categoryId === null ? t("allCategories") : categories.find((c) => c.id === categoryId)?.name ?? t("allCategories");

  const applyFilters = () => {
    setCategoryId(draftCategory);
    setMinPrice(draftMin);
    setMaxPrice(draftMax);
    setMinRating(draftRating);
    setSelectedBrands([...draftBrands]);
    setPage(0);
  };

  const clearFilters = () => {
    setDraftCategory(null);
    setDraftMin("");
    setDraftMax("");
    setDraftRating(null);
    setDraftBrands([]);
    setCategoryId(null);
    setMinPrice("");
    setMaxPrice("");
    setMinRating(null);
    setSelectedBrands([]);
    setQuery("");
    setDebouncedQuery("");
    setPage(0);
  };

  function pageNumbers(): (number | "…")[] {
    if (nbPages <= 7) return Array.from({ length: nbPages }, (_, i) => i);
    const pages: (number | "…")[] = [0];
    if (page > 2) pages.push("…");
    for (let i = Math.max(1, page - 1); i <= Math.min(nbPages - 2, page + 1); i++) pages.push(i);
    if (page < nbPages - 3) pages.push("…");
    pages.push(nbPages - 1);
    return pages;
  }

  const from = total === 0 ? 0 : page * HITS_PER_PAGE + 1;
  const to = Math.min((page + 1) * HITS_PER_PAGE, total);

  return (
    <div className="w-full max-w-[1400px] mx-auto">
      <nav className="text-xs text-[var(--brand-muted)] mb-2" aria-label="Breadcrumb">
        <Link href="/dashboard" className="hover:text-[var(--foreground)]">
          {t("breadcrumbHome")}
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/dashboard/browse" className="hover:text-[var(--foreground)]">
          {t("breadcrumbAll")}
        </Link>
        {categoryId && (
          <>
            <span className="mx-1.5">/</span>
            <span className="text-[var(--foreground)]">{categoryName}</span>
          </>
        )}
      </nav>

      <div className="flex gap-6 items-start">
        {/* Filter sidebar */}
        <aside className="hidden lg:block w-56 xl:w-60 shrink-0">
          <div className="sticky top-20 rounded-xl border border-neutral-200 bg-white dark:bg-[var(--card-bg)] p-5 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold mb-3">{t("filterCategories")}</h3>
              <ul className="space-y-2">
                <li>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="cat"
                      checked={draftCategory === null}
                      onChange={() => setDraftCategory(null)}
                      className="accent-[var(--brand-red)]"
                    />
                    {t("allCategories")}
                  </label>
                </li>
                {categories.map((c) => (
                  <li key={c.id}>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="cat"
                        checked={draftCategory === c.id}
                        onChange={() => setDraftCategory(c.id)}
                        className="accent-[var(--brand-red)]"
                      />
                      {c.name}
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold mb-3">{t("filterPrice")}</h3>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder={t("min")}
                  value={draftMin}
                  onChange={(e) => setDraftMin(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-2.5 py-2 text-xs"
                />
                <input
                  type="number"
                  min={0}
                  placeholder={t("max")}
                  value={draftMax}
                  onChange={(e) => setDraftMax(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-2.5 py-2 text-xs"
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold mb-3">{t("filterRating")}</h3>
              <ul className="space-y-2">
                {[4, 3].map((r) => (
                  <li key={r}>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="rating"
                        checked={draftRating === r}
                        onChange={() => setDraftRating(r)}
                        className="accent-[var(--brand-red)]"
                      />
                      <span className="flex items-center gap-0.5">
                        {r} <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {t("andUp")}
                      </span>
                    </label>
                  </li>
                ))}
                <li>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="rating"
                      checked={draftRating === null}
                      onChange={() => setDraftRating(null)}
                      className="accent-[var(--brand-red)]"
                    />
                    {t("anyRating")}
                  </label>
                </li>
              </ul>
            </div>

            {brands.length > 0 && (
              <div>
                <h3 className="text-sm font-bold mb-3">{t("filterBrand")}</h3>
                <ul className="space-y-2 max-h-36 overflow-y-auto">
                  {brands.map((b) => (
                    <li key={b}>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftBrands.includes(b)}
                          onChange={(e) =>
                            setDraftBrands((prev) =>
                              e.target.checked ? [...prev, b] : prev.filter((x) => x !== b),
                            )
                          }
                          className="accent-[var(--brand-red)] rounded"
                        />
                        {b}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tags.length > 0 && (
              <div>
                <h3 className="text-sm font-bold mb-2">{t("filterTags")}</h3>
                <p className="text-[10px] text-[var(--brand-muted)]">{tags.map((x) => x.name).join(", ")}</p>
              </div>
            )}

            <button
              type="button"
              onClick={applyFilters}
              className="w-full rounded-xl bg-[var(--brand-red)] py-2.5 text-sm font-semibold text-white hover:bg-[#b71c1c]"
            >
              {t("applyFilters")}
            </button>
            <button type="button" onClick={clearFilters} className="w-full text-xs text-[var(--brand-muted)] hover:text-[var(--brand-red)]">
              {t("clearFilters")}
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)]">{t("title")}</h1>
              {!loading && (
                <p className="text-sm text-[var(--brand-muted)] mt-1">
                  {t("showing", { from, to, total: total.toLocaleString() })}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-[var(--brand-muted)] shrink-0">{t("sortBy")}</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as SortOption);
                  setPage(0);
                }}
                className="rounded-lg border border-neutral-200 bg-white dark:bg-[var(--card-bg)] px-3 py-2 text-sm font-medium"
              >
                <option value="newest">{t("sortPopularity")}</option>
                <option value="price-asc">{t("sortPriceAsc")}</option>
                <option value="price-desc">{t("sortPriceDesc")}</option>
                <option value="name-asc">{t("sortName")}</option>
              </select>
            </div>
          </div>

          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--brand-muted)]"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-11 pr-11 text-sm shadow-sm outline-none transition-colors placeholder:text-[var(--brand-muted)] focus:border-[var(--brand-red)] dark:bg-[var(--card-bg)]"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--brand-muted)] hover:bg-neutral-100 hover:text-[var(--foreground)]"
                aria-label={t("clearSearch")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="lg:hidden">
            <button
              type="button"
              onClick={applyFilters}
              className="w-full rounded-xl border border-neutral-200 py-2 text-sm font-semibold"
            >
              {t("applyFilters")}
            </button>
          </div>

          {loading && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-neutral-200 overflow-hidden animate-pulse">
                  <div className="aspect-square bg-neutral-100" />
                  <div className="p-3 h-20 bg-neutral-50" />
                </div>
              ))}
            </div>
          )}

          {!loading && fetchError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
              <Package className="mx-auto h-10 w-10 text-red-400 mb-2" />
              <p className="font-semibold">{fetchError}</p>
            </div>
          )}

          {!loading && !fetchError && filteredProducts.length === 0 && (
            <div className="rounded-xl border border-neutral-200 p-12 text-center">
              <Package className="mx-auto h-12 w-12 text-neutral-300 mb-3" />
              <p className="font-bold">
                {debouncedQuery.trim() ? t("noSearchResults") : t("noResults")}
              </p>
            </div>
          )}

          {!loading && filteredProducts.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((p) => (
                <BrowseProductCard
                  key={p.id}
                  product={p}
                  formatPrice={formatPrice}
                  t={t}
                  tCommon={tCommon}
                  router={router}
                />
              ))}
            </div>
          )}

          {!loading && nbPages > 1 && (
            <nav className="flex justify-center items-center gap-1 pt-4" aria-label="Pagination">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => {
                  setPage((p) => Math.max(0, p - 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="h-9 w-9 rounded-lg border border-neutral-200 flex items-center justify-center disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {pageNumbers().map((pg, i) =>
                pg === "…" ? (
                  <span key={`e-${i}`} className="px-2 text-sm text-neutral-400">
                    …
                  </span>
                ) : (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => {
                      setPage(pg as number);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`h-9 min-w-[2.25rem] rounded-lg text-sm font-semibold ${
                      page === pg
                        ? "bg-[var(--brand-red)] text-white"
                        : "border border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    {(pg as number) + 1}
                  </button>
                ),
              )}
              <button
                type="button"
                disabled={page >= nbPages - 1}
                onClick={() => {
                  setPage((p) => Math.min(nbPages - 1, p + 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="h-9 w-9 rounded-lg border border-neutral-200 flex items-center justify-center disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

function BrowseProductCard({
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
  const [adding, setAdding] = useState(false);
  const rating = pseudoRating(product.id);
  const reviews = pseudoReviews(product.id);
  const price = Number(product.price);
  const original = compareAtPrice(price);
  const badges = productBadges(product.id);

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

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding) return;
    setAdding(true);
    const res = await addToCart(product.id, 1);
    setAdding(false);
    if (res.success) router.push("/dashboard/cart");
  };

  return (
    <article className="rounded-xl border border-neutral-200 bg-white dark:bg-[var(--card-bg)] overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
      <Link href={`/dashboard/product/${product.id}`} className="block relative aspect-square bg-neutral-100">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="(max-width:768px) 50vw, 25vw" />
        ) : (
          <ImageIcon className="absolute inset-0 m-auto h-10 w-10 text-neutral-300" />
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {badges.map((b) => (
            <span key={b} className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${badgeClass(b)}`}>
              {t(`badge_${b}`)}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={toggleFav}
          disabled={favLoading}
          className="absolute top-2 right-2 rounded-full bg-white/95 p-1.5 shadow"
          aria-label={favourited ? t("removeFavorite") : t("addFavorite")}
        >
          <Heart className={`h-4 w-4 ${favourited ? "fill-[var(--brand-red)] text-[var(--brand-red)]" : "text-neutral-500"}`} />
        </button>
      </Link>

      <div className="p-3 flex flex-col flex-1">
        {product.brand && (
          <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-600 mb-0.5">{product.brand}</p>
        )}
        <Link href={`/dashboard/product/${product.id}`}>
          <h3 className="text-sm font-bold line-clamp-2 leading-snug min-h-[2.5rem] hover:text-[var(--brand-red)]">
            {product.name}
          </h3>
        </Link>
        <div className="mt-1 mb-2">
          <StarRatingDisplay rating={rating} reviewCount={reviews} />
        </div>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-base font-bold text-[var(--brand-red)]">{formatPrice(price)}</span>
          <span className="text-xs text-neutral-400 line-through">{formatPrice(original)}</span>
        </div>
        <div className="mt-auto flex gap-2">
          <Link
            href={`/dashboard/product/${product.id}#offer`}
            className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-sky-200 bg-sky-50 text-sky-700 py-2 text-xs font-semibold hover:bg-sky-100"
          >
            <HandCoins className="h-3.5 w-3.5" />
            {t("bargain")}
          </Link>
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding}
            className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-[var(--brand-red)] text-white py-2 text-xs font-semibold hover:bg-[#b71c1c] disabled:opacity-60"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {tCommon("addToCart")}
          </button>
        </div>
      </div>
    </article>
  );
}
