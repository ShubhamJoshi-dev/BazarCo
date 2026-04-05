"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Search, Package, ImageIcon, Heart, X, SlidersHorizontal,
  ChevronRight, ChevronLeft, LayoutGrid, List, Flame,
  ArrowUpDown, Star, ShoppingCart, TrendingUp, Sparkles,
  SortAsc,
} from "lucide-react";
import type { Product, Category, Tag } from "@/types/api";
import { browseProducts, favouriteAdd, favouriteRemove, favouriteCheck } from "@/lib/api";
import { useCurrency } from "@/contexts/CurrencyContext";

const HITS_PER_PAGE = 20;
const SEARCH_DEBOUNCE_MS = 400;

type SortOption = "newest" | "price-asc" | "price-desc" | "name-asc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest",     label: "Newest First" },
  { value: "price-asc",  label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "name-asc",   label: "Name: A → Z" },
];

/* ─── Fake star rating based on product id hash ─── */
function pseudoRating(id: string): number {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return 3.8 + ((Math.abs(hash) % 12) / 10);
}
function pseudoReviews(id: string): number {
  let hash = 0;
  for (const ch of id) hash = (hash * 17 + ch.charCodeAt(0)) & 0xffffffff;
  return 18 + (Math.abs(hash) % 983);
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className="w-3 h-3"
          fill={s <= Math.round(rating) ? "var(--brand-red)" : "transparent"}
          stroke={s <= Math.round(rating) ? "var(--brand-red)" : "var(--brand-muted)"}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

export default function BrowsePage() {
  const { formatPrice } = useCurrency();
  const [query, setQuery]                   = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [categoryId, setCategoryId]         = useState<string | null>(null);
  const [tagIds, setTagIds]                 = useState<string[]>([]);
  const [sortBy, setSortBy]                 = useState<SortOption>("newest");
  const [minPrice, setMinPrice]             = useState<string>("");
  const [maxPrice, setMaxPrice]             = useState<string>("");
  const [page, setPage]                     = useState(0);
  const [products, setProducts]             = useState<Product[]>([]);
  const [trending, setTrending]             = useState<Product[]>([]);
  const [categories, setCategories]         = useState<Category[]>([]);
  const [tags, setTags]                     = useState<Tag[]>([]);
  const [total, setTotal]                   = useState(0);
  const [nbPages, setNbPages]               = useState(0);
  const [loading, setLoading]               = useState(true);
  const [trendingLoaded, setTrendingLoaded] = useState(false);
  const [fetchError, setFetchError]         = useState<string | null>(null);
  const [gridView, setGridView]             = useState<"grid" | "list">("grid");
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const searchRef                           = useRef<HTMLInputElement>(null);

  /* Load trending once on mount */
  useEffect(() => {
    browseProducts({ sortBy: "newest", limit: 8 }).then((res) => {
      setTrending(res.products);
      setTrendingLoaded(true);
    });
  }, []);

  /* Debounce query */
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQuery(query); setPage(0); }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const fetchBrowse = useCallback(async () => {
    setLoading(true); setFetchError(null);
    const res = await browseProducts({
      q: debouncedQuery || undefined,
      category: categoryId ?? undefined,
      tags: tagIds.length ? tagIds : undefined,
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
  }, [debouncedQuery, categoryId, tagIds, sortBy, minPrice, maxPrice, page]);

  useEffect(() => { fetchBrowse(); }, [fetchBrowse]);

  const activeFilters = (categoryId ? 1 : 0) + tagIds.length +
    (minPrice ? 1 : 0) + (maxPrice ? 1 : 0);
  const clearAll = () => {
    setCategoryId(null); setTagIds([]); setPage(0);
    setMinPrice(""); setMaxPrice(""); setSortBy("newest");
  };

  /* Numbered pagination */
  function pageNumbers(): (number | "…")[] {
    if (nbPages <= 7) return Array.from({ length: nbPages }, (_, i) => i);
    const pages: (number | "…")[] = [0];
    if (page > 2) pages.push("…");
    for (let i = Math.max(1, page - 1); i <= Math.min(nbPages - 2, page + 1); i++) pages.push(i);
    if (page < nbPages - 3) pages.push("…");
    pages.push(nbPages - 1);
    return pages;
  }

  return (
    <div className="space-y-4">

      {/* ── Search + controls bar ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col sm:flex-row gap-3"
      >
        {/* Search input */}
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--brand-muted)] group-focus-within:text-[var(--brand-blue)] transition-colors pointer-events-none z-10" />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, brands, categories…"
            className="clay-input w-full pl-11 pr-10 py-3 text-[var(--foreground)] placeholder:text-[var(--brand-muted)] text-sm"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--brand-muted)]/15 text-[var(--brand-muted)] transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="relative shrink-0">
          <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--brand-muted)] pointer-events-none" />
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as SortOption); setPage(0); }}
            className="clay-input pl-9 pr-8 py-3 text-sm font-medium text-[var(--foreground)] cursor-pointer appearance-none min-w-[160px]"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--brand-muted)] pointer-events-none" />
        </div>

        {/* View toggle + filter toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex rounded-2xl overflow-hidden border border-[var(--brand-border)]"
            style={{ boxShadow: "var(--clay-shadow-neutral)" }}>
            {(["grid", "list"] as const).map((v) => (
              <button key={v} type="button" onClick={() => setGridView(v)}
                className={`p-2.5 transition-all ${gridView === v ? "bg-[var(--brand-blue)] text-white" : "bg-[var(--card-bg)] text-[var(--brand-muted)] hover:text-[var(--foreground)]"}`}>
                {v === "grid" ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setSidebarOpen((o) => !o)}
            className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all ${sidebarOpen ? "clay-btn-blue" : "clay-card text-[var(--foreground)]"}`}>
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilters > 0 && <span className="clay-badge-red">{activeFilters}</span>}
          </button>
        </div>
      </motion.div>

      {/* Active filter chips */}
      {activeFilters > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          className="flex flex-wrap gap-2 items-center"
        >
          {categoryId && (
            <button type="button" onClick={() => { setCategoryId(null); setPage(0); }}
              className="clay-badge-blue flex items-center gap-1 cursor-pointer hover:opacity-75 transition-opacity text-xs">
              {categories.find((c) => c.id === categoryId)?.name} <X className="w-3 h-3" />
            </button>
          )}
          {tagIds.map((id) => (
            <button key={id} type="button" onClick={() => setTagIds((p) => p.filter((x) => x !== id))}
              className="clay-badge-red flex items-center gap-1 cursor-pointer hover:opacity-75 transition-opacity text-xs">
              {tags.find((t) => t.id === id)?.name} <X className="w-3 h-3" />
            </button>
          ))}
          {minPrice && (
            <button type="button" onClick={() => setMinPrice("")}
              className="clay-badge-blue flex items-center gap-1 cursor-pointer hover:opacity-75 transition-opacity text-xs">
              Min ₹{minPrice} <X className="w-3 h-3" />
            </button>
          )}
          {maxPrice && (
            <button type="button" onClick={() => setMaxPrice("")}
              className="clay-badge-red flex items-center gap-1 cursor-pointer hover:opacity-75 transition-opacity text-xs">
              Max ₹{maxPrice} <X className="w-3 h-3" />
            </button>
          )}
          <button type="button" onClick={clearAll}
            className="text-xs font-semibold text-[var(--brand-muted)] hover:text-[var(--brand-red)] transition-colors underline ml-1">
            Clear all
          </button>
        </motion.div>
      )}

      {/* ── Trending Now strip ── */}
      {trendingLoaded && trending.length > 0 && !debouncedQuery && !categoryId && tagIds.length === 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="space-y-2.5"
        >
          <div className="flex items-center gap-2">
            <span className="clay-badge-red flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold">
              <Flame className="w-3.5 h-3.5" /> Trending Now
            </span>
            <span className="text-xs text-[var(--brand-muted)] flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Latest arrivals
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {trending.map((p) => (
              <TrendingCard key={p.id} product={p} />
            ))}
          </div>
        </motion.section>
      )}

      {/* ── Main layout: collapsible sidebar + product grid ── */}
      <div className="flex gap-5 items-start">

        {/* Filter sidebar — slides in */}
        {sidebarOpen && (
          <motion.aside
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="w-52 xl:w-56 shrink-0"
          >
            <div className="clay-card p-5 sticky top-4 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--foreground)]">
                  <SlidersHorizontal className="w-4 h-4 text-[var(--brand-blue)]" /> Filters
                </h3>
                {activeFilters > 0 && (
                  <button type="button" onClick={clearAll}
                    className="text-xs text-[var(--brand-red)] hover:underline font-semibold">
                    Reset
                  </button>
                )}
              </div>

              {/* Categories */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-muted)] mb-2.5">Category</p>
                <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto scrollbar-hide">
                  {[{ id: null as string | null, name: "All Products" }, ...categories].map((c, i) => {
                    const active = c.id === null ? categoryId === null : categoryId === c.id;
                    return (
                      <motion.button key={c.id ?? "all"} type="button"
                        onClick={() => { setCategoryId(c.id); setPage(0); }}
                        initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.04 + i * 0.02 }}
                        className={`clay-sidebar-link flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-all ${active ? "active" : ""}`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? "bg-[var(--brand-red)]" : "bg-[var(--brand-muted)]/40"}`} />
                          <span className="truncate text-xs">{c.name}</span>
                        </span>
                        {active && <ChevronRight className="w-3 h-3 text-[var(--brand-red)] shrink-0" />}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-muted)] mb-2.5">Price Range</p>
                <div className="flex gap-2 mb-2">
                  <div className="flex-1">
                    <label className="text-[9px] font-semibold text-[var(--brand-muted)] mb-1 block">Min</label>
                    <input type="number" min="0" value={minPrice}
                      onChange={(e) => { setMinPrice(e.target.value); setPage(0); }}
                      placeholder="0"
                      className="clay-input w-full px-2.5 py-2 text-xs text-[var(--foreground)]"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[9px] font-semibold text-[var(--brand-muted)] mb-1 block">Max</label>
                    <input type="number" min="0" value={maxPrice}
                      onChange={(e) => { setMaxPrice(e.target.value); setPage(0); }}
                      placeholder="Any"
                      className="clay-input w-full px-2.5 py-2 text-xs text-[var(--foreground)]"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: "Under ₹50",  min: "", max: "50" },
                    { label: "₹50–₹200",   min: "50", max: "200" },
                    { label: "₹200+",       min: "200", max: "" },
                  ].map((preset) => (
                    <button key={preset.label} type="button"
                      onClick={() => { setMinPrice(preset.min); setMaxPrice(preset.max); setPage(0); }}
                      className={`text-[10px] px-2 py-1 rounded-full font-semibold border transition-all ${
                        minPrice === preset.min && maxPrice === preset.max
                          ? "clay-badge-blue"
                          : "border-[var(--brand-border)] text-[var(--brand-muted)] hover:border-[var(--brand-blue)]/40 hover:text-[var(--brand-blue)]"
                      }`}>
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-muted)] mb-2.5">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t, i) => {
                      const sel = tagIds.includes(t.id);
                      return (
                        <motion.button key={t.id} type="button"
                          onClick={() => { setTagIds((p) => sel ? p.filter((x) => x !== t.id) : [...p, t.id]); setPage(0); }}
                          initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.08 + i * 0.02 }}
                          whileTap={{ scale: 0.92 }}
                          className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border cursor-pointer transition-all ${
                            sel ? "clay-badge-red border-transparent" : "border-[var(--brand-border)] text-[var(--brand-muted)] hover:border-[var(--brand-blue)]/40 hover:text-[var(--brand-blue)]"
                          }`}
                        >
                          {t.name}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        )}

        {/* ── Products area ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Results bar */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-[var(--brand-muted)]">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--brand-blue)] animate-pulse" /> Searching…
                </span>
              ) : (
                <>
                  <span className="text-[var(--foreground)] font-bold">{total.toLocaleString()}</span>
                  {" "}result{total !== 1 ? "s" : ""}
                  {debouncedQuery && <> for <span className="text-[var(--brand-blue)] font-semibold">&ldquo;{debouncedQuery}&rdquo;</span></>}
                  {categoryId && categories.find((c) => c.id === categoryId) && (
                    <> in <span className="text-[var(--brand-red)] font-semibold">{categories.find((c) => c.id === categoryId)?.name}</span></>
                  )}
                </>
              )}
            </p>
            {!loading && nbPages > 0 && (
              <span className="text-xs text-[var(--brand-muted)] clay-badge-blue">
                Page {page + 1} of {nbPages}
              </span>
            )}
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className={`grid gap-4 ${gridView === "grid" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"}`}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="clay-card overflow-hidden" style={{ opacity: 1 - i * 0.1 }}>
                  <div className="aspect-square bg-[var(--brand-border)] relative overflow-hidden rounded-t-[24px]">
                    <div className="absolute inset-0 loading-shimmer-bar opacity-20 rounded-t-[24px]" />
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="h-3 rounded-full bg-[var(--brand-border)] loading-shimmer-bar opacity-30 w-3/4" />
                    <div className="h-3 rounded-full bg-[var(--brand-border)] loading-shimmer-bar opacity-20 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && fetchError && (
            <div className="clay-card-red p-10 text-center">
              <Package className="mx-auto w-12 h-12 text-[var(--brand-red)]/50 mb-3" />
              <p className="font-bold text-[var(--foreground)]">Could not load products</p>
              <p className="text-sm text-[var(--brand-muted)] mt-1">{fetchError}</p>
            </div>
          )}

          {/* Empty */}
          {!loading && !fetchError && products.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="clay-card p-16 text-center">
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                <Package className="mx-auto w-14 h-14 text-[var(--brand-muted)]/30 mb-4" />
              </motion.div>
              <p className="text-lg font-black text-[var(--foreground)] mb-2">No products found</p>
              <p className="text-sm text-[var(--brand-muted)] mb-6">
                {activeFilters > 0 || debouncedQuery ? "Try adjusting your search or removing filters." : "No products in the marketplace yet."}
              </p>
              {activeFilters > 0 && (
                <button type="button" onClick={clearAll} className="clay-btn-blue px-8 py-3 text-sm">
                  Clear filters
                </button>
              )}
            </motion.div>
          )}

          {/* Product grid */}
          {!loading && products.length > 0 && (
            <div className={`grid gap-4 ${
              gridView === "grid"
                ? sidebarOpen
                  ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                : "grid-cols-1"
            }`}>
              {products.map((p, i) => (
                <motion.div key={p.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02, duration: 0.28 }}>
                  <ProductCard product={p} listView={gridView === "list"} />
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && nbPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4 flex-wrap">
              <button type="button"
                onClick={() => { setPage((p) => Math.max(0, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                disabled={page === 0}
                className="clay-btn-blue flex items-center gap-1.5 px-4 py-2.5 text-sm disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <div className="flex items-center gap-1">
                {pageNumbers().map((pg, i) =>
                  pg === "…" ? (
                    <span key={`e-${i}`} className="px-2 text-[var(--brand-muted)] font-bold">…</span>
                  ) : (
                    <button key={pg} type="button"
                      onClick={() => { setPage(pg as number); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className={`w-9 h-9 rounded-2xl text-sm font-bold transition-all ${
                        page === pg ? "clay-btn-red" : "clay-card text-[var(--brand-muted)] hover:text-[var(--foreground)]"
                      }`}
                      style={page === pg ? {} : { boxShadow: "var(--clay-shadow-neutral)" }}>
                      {(pg as number) + 1}
                    </button>
                  )
                )}
              </div>
              <button type="button"
                onClick={() => { setPage((p) => Math.min(nbPages - 1, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                disabled={page >= nbPages - 1}
                className="clay-btn-red flex items-center gap-1.5 px-4 py-2.5 text-sm disabled:opacity-40">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Trending horizontal card ─── */
function TrendingCard({ product }: { product: Product }) {
  const rating = pseudoRating(product.id);
  const { formatPrice } = useCurrency();
  return (
    <motion.div
      className="shrink-0 w-36"
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}>
      <Link href={`/dashboard/product/${product.id}`} className="block clay-card overflow-hidden" style={{ padding: 0 }}>
        <div className="w-36 h-32 bg-[var(--brand-border)] relative overflow-hidden rounded-t-[24px]">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="144px" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-[var(--brand-muted)]" />
            </div>
          )}
          {product.category && (
            <span className="absolute top-2 left-2 clay-badge-blue text-[9px] px-1.5 py-0.5">{product.category}</span>
          )}
        </div>
        <div className="p-2.5">
          <p className="text-xs font-bold text-[var(--foreground)] truncate leading-tight">{product.name}</p>
          <p className="text-xs font-black text-[var(--brand-blue)] mt-0.5">{formatPrice(Number(product.price))}</p>
          <StarRating rating={rating} />
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── Main product card ─── */
function ProductCard({ product, listView }: { product: Product; listView: boolean }) {
  const [favourited, setFavourited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const rating = pseudoRating(product.id);
  const reviews = pseudoReviews(product.id);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    favouriteCheck(product.id).then(setFavourited);
  }, [product.id]);

  const toggleFav = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (favLoading) return;
    setFavLoading(true);
    const ok = favourited ? await favouriteRemove(product.id) : await favouriteAdd(product.id);
    setFavLoading(false);
    if (ok) setFavourited(!favourited);
  };

  if (listView) {
    return (
      <div className="clay-card overflow-hidden transition-all hover:-translate-y-0.5"
        style={{ transition: "transform 0.2s, box-shadow 0.2s" }}>
        <Link href={`/dashboard/product/${product.id}`} className="flex gap-4 p-4">
          <div className="relative w-28 h-28 rounded-2xl bg-[var(--brand-border)] shrink-0 overflow-hidden">
            {product.imageUrl ? (
              <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="112px" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-[var(--brand-muted)]" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold text-[var(--foreground)] line-clamp-2 leading-snug hover:text-[var(--brand-blue)] transition-colors">
                {product.name}
              </h3>
              <span className="clay-badge-blue shrink-0 text-sm font-black">
                {formatPrice(Number(product.price))}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={rating} />
              <span className="text-[11px] text-[var(--brand-muted)]">({reviews.toLocaleString()})</span>
            </div>
            {product.description && (
              <p className="text-xs text-[var(--brand-muted)] line-clamp-2 mt-1.5">{product.description}</p>
            )}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {product.category && <span className="clay-badge-blue text-[10px]">{product.category}</span>}
              {product.tags?.slice(0, 2).map((t) => (
                <span key={t} className="clay-badge-red text-[10px]">{t}</span>
              ))}
            </div>
          </div>
          <button type="button" onClick={toggleFav} disabled={favLoading}
            className="shrink-0 p-2 rounded-2xl hover:bg-[var(--brand-red)]/10 transition-colors self-start">
            <Heart className={`w-5 h-5 transition-all ${favourited ? "fill-[var(--brand-red)] text-[var(--brand-red)] scale-110" : "text-[var(--brand-muted)]"}`} />
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="clay-card overflow-hidden group cursor-pointer transition-all hover:-translate-y-1.5 hover:shadow-lg"
      style={{ padding: 0, transition: "transform 0.2s ease, box-shadow 0.2s ease" }}>
      <Link href={`/dashboard/product/${product.id}`} className="block">
        {/* Image */}
        <div className="aspect-[4/3] bg-[var(--brand-border)] relative overflow-hidden rounded-t-[24px]">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, 33vw" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageIcon className="w-14 h-14 text-[var(--brand-muted)]/40" />
            </div>
          )}
          {/* Fav button */}
          <button type="button" onClick={toggleFav} disabled={favLoading}
            className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
            style={{ background: "rgba(255,255,255,0.92)", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
            <Heart className={`w-4 h-4 transition-all ${favourited ? "fill-[var(--brand-red)] text-[var(--brand-red)]" : "text-[var(--brand-muted)]"}`} />
          </button>
          {/* Category badge */}
          {product.category && (
            <span className="absolute top-2.5 left-2.5 clay-badge-blue text-[10px]">{product.category}</span>
          )}
          {/* Tags at bottom */}
          {(product.tags?.length ?? 0) > 0 && (
            <div className="absolute bottom-2.5 left-2.5 flex gap-1 flex-wrap">
              {product.tags!.slice(0, 2).map((t) => (
                <span key={t} className="clay-badge-red text-[9px] px-1.5 py-0.5">{t}</span>
              ))}
            </div>
          )}
        </div>
        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-[var(--foreground)] line-clamp-2 text-sm leading-snug group-hover:text-[var(--brand-blue)] transition-colors min-h-[2.5rem]">
            {product.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5">
            <StarRating rating={rating} />
            <span className="text-[10px] text-[var(--brand-muted)]">({reviews.toLocaleString()})</span>
          </div>
          <div className="flex items-center justify-between gap-1 mt-2 min-w-0">
            <span className="font-black text-[var(--brand-blue)] text-sm sm:text-base truncate min-w-0 flex-1">
              {formatPrice(Number(product.price))}
            </span>
            <span className="flex items-center gap-0.5 text-[11px] font-semibold text-[var(--brand-red)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <ShoppingCart className="w-3 h-3" /> Add
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
