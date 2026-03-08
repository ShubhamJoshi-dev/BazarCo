"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Package, ImageIcon, Filter, ChevronRight, Heart, X } from "lucide-react";
import type { Product, Category, Tag } from "@/types/api";
import { browseProducts, favouriteAdd, favouriteRemove, favouriteCheck } from "@/lib/api";

const HITS_PER_PAGE = 24;
const SEARCH_DEBOUNCE_MS = 350;

export default function BrowsePage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [total, setTotal] = useState(0);
  const [nbPages, setNbPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const fetchBrowse = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const res = await browseProducts({
      q: debouncedQuery || undefined,
      category: categoryId ?? undefined,
      tags: tagIds.length ? tagIds : undefined,
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
  }, [debouncedQuery, categoryId, tagIds, page]);

  useEffect(() => {
    fetchBrowse();
  }, [fetchBrowse]);

  const showEmpty = !loading && products.length === 0 && !fetchError;
  const showResults = !loading && products.length > 0;
  const showError = !loading && fetchError;

  return (
    <div className="min-h-screen">
      {/* Search bar */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-20 bg-[var(--background)]/90 backdrop-blur-xl border-b border-white/5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.2)]"
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-[var(--brand-blue)] transition-colors duration-200 pointer-events-none z-10" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder="Search products by name or description…"
              className="w-full rounded-2xl bg-white/[0.06] pl-12 pr-12 py-3.5 text-[var(--brand-white)] placeholder:text-neutral-500 focus:outline-none focus:bg-white/[0.09] focus:shadow-[0_0_0_1px_rgba(100,181,246,0.4),0_0_20px_-4px_rgba(100,181,246,0.15)] transition-all duration-300 border border-transparent focus:border-[var(--brand-blue)]/30"
              aria-label="Search products"
            />
            <AnimatePresence>
              {query.length > 0 && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => { setQuery(""); setPage(0); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-neutral-400 hover:text-[var(--brand-white)] hover:bg-white/10 transition-colors"
                  aria-label="Clear search"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-8">
        {/* Filters — left sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="w-56 shrink-0 hidden sm:block"
        >
          <div className="sticky top-24 rounded-2xl bg-white/[0.04] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition-all duration-200 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_8px_24px_-8px_rgba(0,0,0,0.15)]">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-white)] mb-3">
              <Filter className="w-4 h-4 text-[var(--brand-blue)]" />
              Filters
            </h3>
            <p className="text-xs text-neutral-500 mb-2">Category</p>
            <div className="flex flex-col gap-1 mb-4">
              <motion.button
                type="button"
                onClick={() => { setCategoryId(null); setPage(0); }}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`text-left rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  categoryId === null ? "bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] border border-[var(--brand-blue)]/40" : "text-neutral-400 hover:text-[var(--brand-white)] hover:bg-white/5"
                }`}
              >
                All
              </motion.button>
              {categories.map((c, i) => (
                <motion.button
                  key={c.id}
                  type="button"
                  onClick={() => { setCategoryId(c.id); setPage(0); }}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.03 }}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`text-left rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    categoryId === c.id ? "bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] border border-[var(--brand-blue)]/40" : "text-neutral-400 hover:text-[var(--brand-white)] hover:bg-white/5"
                  }`}
                >
                  {c.name}
                </motion.button>
              ))}
            </div>
            <p className="text-xs text-neutral-500 mb-2">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t, i) => {
                const selected = tagIds.includes(t.id);
                return (
                  <motion.button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTagIds((prev) => selected ? prev.filter((id) => id !== t.id) : [...prev, t.id]);
                      setPage(0);
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 + i * 0.02 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      selected ? "bg-[var(--brand-red)]/20 text-[var(--brand-red)] border border-[var(--brand-red)]/40" : "bg-white/10 text-neutral-400 hover:text-[var(--brand-white)] hover:bg-white/15"
                    }`}
                  >
                    {t.name}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.aside>

        {/* Products — right, main content */}
        <main className="flex-1 min-w-0">
          {/* Mobile filters */}
          <div className="sm:hidden mb-4 flex flex-wrap gap-2">
            <motion.button
              type="button"
              onClick={() => { setCategoryId(null); setPage(0); }}
              whileTap={{ scale: 0.96 }}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${categoryId === null ? "bg-[var(--brand-blue)] text-white" : "bg-white/10 text-neutral-400 hover:bg-white/15"}`}
            >
              All
            </motion.button>
            {categories.map((c, i) => (
              <motion.button
                key={c.id}
                type="button"
                onClick={() => { setCategoryId(c.id); setPage(0); }}
                whileTap={{ scale: 0.96 }}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.03 }}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${categoryId === c.id ? "bg-[var(--brand-blue)] text-white" : "bg-white/10 text-neutral-400 hover:bg-white/15"}`}
              >
                {c.name}
              </motion.button>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mb-4 flex flex-wrap items-center justify-between gap-2"
          >
            <p className="text-sm text-neutral-400">
              {loading ? "Searching…" : total === 0 ? "No products" : `Showing ${products.length} of ${total} products`}
            </p>
          </motion.div>

          {loading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ delay: i * 0.05, repeat: Infinity, duration: 1.2, repeatType: "reverse" }}
                  className="relative rounded-2xl bg-white/[0.04] overflow-hidden aspect-[3/4]"
                >
                  <div className="absolute inset-0 loading-shimmer-bar opacity-20" />
                </motion.div>
              ))}
            </div>
          )}

          {showError && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="rounded-2xl bg-[var(--brand-red)]/10 p-8 text-center shadow-[0_0_0_1px_rgba(229,115,115,0.2)]"
            >
              <p className="text-[var(--brand-white)] font-medium mb-1">Could not load products</p>
              <p className="text-sm text-neutral-400 mb-2">{fetchError}</p>
              <p className="text-xs text-neutral-500">Make sure you're signed in and the backend is running.</p>
            </motion.div>
          )}

          {showEmpty && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="rounded-2xl bg-white/[0.04] p-12 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Package className="mx-auto w-14 h-14 text-neutral-600 mb-4" />
              </motion.div>
              <p className="text-[var(--brand-white)] font-medium mb-1">No products found</p>
              <p className="text-sm text-neutral-400">
                {debouncedQuery || categoryId || tagIds.length ? "Try a different search or category." : "No products in the marketplace yet. Sellers can add products from Listings, or run the backend seeder: npm run seed:products"}
              </p>
            </motion.div>
          )}

          {showResults && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {products.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </AnimatePresence>
            </div>
          )}

          {showResults && nbPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-3"
            >
              <motion.button
                type="button"
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={page === 0}
                whileHover={page > 0 ? { scale: 1.03 } : {}}
                whileTap={page > 0 ? { scale: 0.98 } : {}}
                className="rounded-xl bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-[var(--brand-white)] hover:bg-white/[0.1] disabled:opacity-40 disabled:pointer-events-none transition-colors border border-white/5"
              >
                Previous
              </motion.button>
              <span className="text-sm text-neutral-400 px-2">
                Page {page + 1} of {nbPages}
              </span>
              <motion.button
                type="button"
                onClick={() => setPage((prev) => Math.min(nbPages - 1, prev + 1))}
                disabled={page >= nbPages - 1}
                whileHover={page < nbPages - 1 ? { scale: 1.03 } : {}}
                whileTap={page < nbPages - 1 ? { scale: 0.98 } : {}}
                className="rounded-xl bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-[var(--brand-white)] hover:bg-white/[0.1] disabled:opacity-40 disabled:pointer-events-none transition-colors border border-white/5"
              >
                Next
              </motion.button>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const [favourited, setFavourited] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    favouriteCheck(product.id).then(setFavourited);
  }, [product.id]);
  const toggleFavourite = async () => {
    if (loading) return;
    setLoading(true);
    const ok = favourited ? await favouriteRemove(product.id) : await favouriteAdd(product.id);
    setLoading(false);
    if (ok) setFavourited(!favourited);
  };
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 400, damping: 28 }}
      whileHover={{ y: -6, scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 25 } }}
      className="group rounded-2xl bg-white/[0.04] overflow-hidden hover:bg-white/[0.07] transition-shadow duration-300 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_12px_32px_-8px_rgba(100,181,246,0.15)]"
    >
      <Link href={`/dashboard/product/${product.id}`} className="block">
      <div className="aspect-square bg-white/5 relative overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-600">
            <ImageIcon className="w-14 h-14" />
          </div>
        )}
        <motion.button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavourite(); }}
          disabled={loading}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="absolute top-2 right-2 z-10 rounded-full bg-black/60 p-2 backdrop-blur-sm hover:bg-black/80 transition-colors disabled:opacity-60"
          aria-label={favourited ? "Remove from favourites" : "Add to favourites"}
        >
          <Heart className={`w-5 h-5 transition-colors ${favourited ? "fill-[var(--brand-red)] text-[var(--brand-red)]" : "text-white"}`} />
        </motion.button>
        {product.category && (
          <span className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            {product.category}
          </span>
        )}
        {(product.tags?.length ?? 0) > 0 && (
          <div className="absolute bottom-10 left-2 right-2 flex flex-wrap gap-1">
            {product.tags!.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded bg-black/60 px-1.5 py-0.5 text-xs text-white backdrop-blur-sm">{tag}</span>
            ))}
          </div>
        )}
        <div className="absolute bottom-2 right-2 rounded-lg bg-[var(--brand-blue)] px-3 py-1.5 text-sm font-semibold text-white shadow-lg">
          ${Number(product.price).toFixed(2)}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-[var(--brand-white)] truncate group-hover:text-[var(--brand-blue)] transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-1 text-sm text-neutral-400 line-clamp-2">{product.description}</p>
        )}
        <div className="mt-3 flex items-center gap-1 text-xs text-neutral-500 group-hover:text-[var(--brand-blue)] transition-colors">
          <span>View product</span>
          <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      </div>
      </Link>
    </motion.article>
  );
}
