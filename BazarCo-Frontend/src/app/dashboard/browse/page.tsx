"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Package, ImageIcon, Filter, ChevronRight, Heart } from "lucide-react";
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
      {/* Search bar — top, full width */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-20 border-b border-white/10 bg-[var(--brand-black)]/95 backdrop-blur-md"
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder="Search products by name or description…"
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-12 pr-4 py-3 text-[var(--brand-white)] placeholder:text-neutral-500 focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/30 transition-all"
              aria-label="Search products"
            />
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-8">
        {/* Filters — left sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          className="w-56 shrink-0 hidden sm:block"
        >
          <div className="sticky top-24 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-white)] mb-3">
              <Filter className="w-4 h-4 text-[var(--brand-blue)]" />
              Filters
            </h3>
            <p className="text-xs text-neutral-500 mb-2">Category</p>
            <div className="flex flex-col gap-1 mb-4">
              <button
                type="button"
                onClick={() => { setCategoryId(null); setPage(0); }}
                className={`text-left rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  categoryId === null ? "bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] border border-[var(--brand-blue)]/40" : "text-neutral-400 hover:text-[var(--brand-white)] hover:bg-white/5"
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { setCategoryId(c.id); setPage(0); }}
                  className={`text-left rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    categoryId === c.id ? "bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] border border-[var(--brand-blue)]/40" : "text-neutral-400 hover:text-[var(--brand-white)] hover:bg-white/5"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-neutral-500 mb-2">Tags</p>
            <div className="flex flex-wrap gap-1">
              {tags.map((t) => {
                const selected = tagIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTagIds((prev) => selected ? prev.filter((id) => id !== t.id) : [...prev, t.id]);
                      setPage(0);
                    }}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      selected ? "bg-[var(--brand-red)]/20 text-[var(--brand-red)] border border-[var(--brand-red)]/40" : "bg-white/10 text-neutral-400 hover:text-[var(--brand-white)]"
                    }`}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.aside>

        {/* Products — right, main content */}
        <main className="flex-1 min-w-0">
          {/* Mobile filters */}
          <div className="sm:hidden mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { setCategoryId(null); setPage(0); }}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${categoryId === null ? "bg-[var(--brand-blue)] text-white" : "bg-white/10 text-neutral-400"}`}
            >
              All
            </button>
            {categories.map((c) => (
              <button key={c.id} type="button" onClick={() => { setCategoryId(c.id); setPage(0); }}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${categoryId === c.id ? "bg-[var(--brand-blue)] text-white" : "bg-white/10 text-neutral-400"}`}>
                {c.name}
              </button>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
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
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: 0.6 }}
                  className="rounded-xl border border-white/10 bg-white/5 overflow-hidden aspect-[3/4]"
                />
              ))}
            </div>
          )}

          {showError && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-[var(--brand-red)]/30 bg-[var(--brand-red)]/10 p-8 text-center"
            >
              <p className="text-[var(--brand-white)] font-medium mb-1">Could not load products</p>
              <p className="text-sm text-neutral-400 mb-2">{fetchError}</p>
              <p className="text-xs text-neutral-500">Make sure you're signed in and the backend is running.</p>
            </motion.div>
          )}

          {showEmpty && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center"
            >
              <Package className="mx-auto w-14 h-14 text-neutral-600 mb-4" />
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-2"
            >
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={page === 0}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[var(--brand-white)] hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none"
              >
                Previous
              </button>
              <span className="text-sm text-neutral-400 px-2">
                Page {page + 1} of {nbPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(nbPages - 1, prev + 1))}
                disabled={page >= nbPages - 1}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[var(--brand-white)] hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none"
              >
                Next
              </button>
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.03, type: "spring", stiffness: 400, damping: 30 }}
      whileHover={{ y: -4 }}
      className="group rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-[var(--brand-blue)]/30 hover:bg-white/[0.06] transition-all duration-200"
    >
      <div className="aspect-square bg-white/5 relative overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-600">
            <ImageIcon className="w-14 h-14" />
          </div>
        )}
        <button
          type="button"
          onClick={toggleFavourite}
          disabled={loading}
          className="absolute top-2 right-2 rounded-full bg-black/60 p-2 backdrop-blur-sm hover:bg-black/80 transition-colors disabled:opacity-60"
          aria-label={favourited ? "Remove from favourites" : "Add to favourites"}
        >
          <Heart className={`w-5 h-5 ${favourited ? "fill-[var(--brand-red)] text-[var(--brand-red)]" : "text-white"}`} />
        </button>
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
        <div className="mt-3 flex items-center gap-1 text-xs text-neutral-500">
          <span>View product</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </motion.article>
  );
}
