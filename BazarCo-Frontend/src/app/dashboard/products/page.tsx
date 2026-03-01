"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Archive,
  ArchiveRestore,
  X,
  ImageIcon,
} from "lucide-react";
import type { Product } from "@/types/api";
import {
  productsList,
  productCreate,
  productUpdate,
  productDelete,
  productArchive,
  productUnarchive,
  categoriesList,
  categoryCreate,
  tagsList,
  tagCreate,
} from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useAuth } from "@/contexts/AuthContext";

type Filter = "all" | "active" | "archived";

export default function ProductsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isSeller = user?.role === "seller";

  const fetchProducts = useCallback(async () => {
    if (!isSeller) return;
    setLoading(true);
    const status = filter === "all" ? undefined : filter;
    const list = await productsList(status);
    setProducts(list);
    setLoading(false);
  }, [filter, isSeller]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleArchive = async (p: Product) => {
    if (p.status === "archived") {
      const updated = await productUnarchive(p.id);
      if (updated) {
        setProducts((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
        toast.success("Product unarchived.");
      } else toast.error("Could not unarchive product.");
    } else {
      const updated = await productArchive(p.id);
      if (updated) {
        setProducts((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
        toast.success("Product archived.");
      } else toast.error("Could not archive product.");
    }
  };

  const handleDeleteClick = (p: Product) => setProductToDelete(p);

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    const ok = await productDelete(productToDelete.id);
    setDeleting(false);
    setProductToDelete(null);
    if (ok) {
      setProducts((prev) => prev.filter((x) => x.id !== productToDelete.id));
      toast.success("Product deleted.");
    } else toast.error("Could not delete product.");
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setModal("edit");
  };

  const closeModal = () => {
    setModal(null);
    setEditingProduct(null);
    setFormError(null);
  };

  if (!isSeller) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
        <Package className="mx-auto w-14 h-14 text-neutral-500 mb-4" />
        <p className="text-[var(--brand-white)] font-medium mb-1">Seller only</p>
        <p className="text-sm text-neutral-400 mb-6">This page is for sellers. As a buyer, you can browse and buy from the marketplace.</p>
        <Link href="/dashboard/browse" className="inline-block rounded-xl bg-[var(--brand-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-blue)]/90">
          Go to Browse
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-[var(--brand-white)]">Products</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5">
            {(["all", "active", "archived"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                  filter === f
                    ? "bg-[var(--brand-blue)] text-white"
                    : "text-neutral-400 hover:text-[var(--brand-white)]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setModal("add")}
            className="flex items-center gap-2 rounded-xl bg-[var(--brand-red)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-red)]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add product
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-neutral-400">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="settings-card rounded-2xl border border-white/10 p-12 text-center"
        >
          <Package className="mx-auto w-12 h-12 text-neutral-500 mb-4" />
          <p className="text-[var(--brand-white)] font-medium mb-1">No products yet</p>
          <p className="text-sm text-neutral-400 mb-6">
            {filter !== "all" ? `No ${filter} products.` : "Add your first product to get started."}
          </p>
          {filter === "all" && (
            <button
              type="button"
              onClick={() => setModal("add")}
              className="rounded-xl bg-[var(--brand-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-blue)]/90"
            >
              Add product
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {products.map((p, i) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.03 }}
                className="settings-card rounded-xl border border-white/10 overflow-hidden group"
              >
                <div className="aspect-square bg-white/5 relative">
                  {p.imageUrl ? (
                    <Image
                      src={p.imageUrl}
                      alt={p.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-neutral-600">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === "archived"
                          ? "bg-neutral-600 text-white"
                          : "bg-[var(--brand-blue)]/20 text-[var(--brand-blue)]"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-[var(--brand-white)] truncate">{p.name}</h3>
                  <p className="text-sm text-[var(--brand-blue)] mt-0.5">
                    ${Number(p.price).toFixed(2)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-[var(--brand-white)] hover:bg-[var(--brand-blue)]/20 hover:border-[var(--brand-blue)]/30 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleArchive(p)}
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-[var(--brand-white)] hover:bg-white/10 transition-colors"
                    >
                      {p.status === "archived" ? (
                        <><ArchiveRestore className="w-3.5 h-3.5" /> Unarchive</>
                      ) : (
                        <><Archive className="w-3.5 h-3.5" /> Archive</>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(p)}
                      className="flex items-center gap-1.5 rounded-lg border border-[var(--brand-red)]/30 bg-[var(--brand-red)]/10 px-2.5 py-1.5 text-xs font-medium text-[var(--brand-red)] hover:bg-[var(--brand-red)]/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {modal && (
          <ProductFormModal
            mode={modal}
            product={editingProduct}
            onClose={closeModal}
            onSuccess={() => {
              closeModal();
              fetchProducts();
            }}
            submitting={submitting}
            setSubmitting={setSubmitting}
            error={formError}
            setError={setFormError}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        open={productToDelete !== null}
        title="Delete product?"
        message={productToDelete ? `"${productToDelete.name}" will be permanently removed.` : ""}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => !deleting && setProductToDelete(null)}
      />
    </div>
  );
}

function ProductFormModal({
  mode,
  product,
  onClose,
  onSuccess,
  submitting,
  setSubmitting,
  error,
  setError,
}: {
  mode: "add" | "edit";
  product: Product | null;
  onClose: () => void;
  onSuccess: () => void;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
  error: string | null;
  setError: (v: string | null) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price ?? 0);
  const [categoryId, setCategoryId] = useState<string | null>(product?.categoryId ?? null);
  const [tagIds, setTagIds] = useState<string[]>(product?.tagIds ?? []);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.imageUrl ?? null);

  useEffect(() => {
    setName(product?.name ?? "");
    setDescription(product?.description ?? "");
    setPrice(product?.price ?? 0);
    setCategoryId(product?.categoryId ?? null);
    setTagIds(product?.tagIds ?? []);
    setImagePreview(product?.imageUrl ?? null);
    setImageFile(null);
  }, [product]);

  useEffect(() => {
    categoriesList().then(setCategories);
    tagsList().then(setTags);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please choose an image (JPEG, PNG, WebP, GIF).");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview(product?.imageUrl ?? null);
    }
  };

  const addNewCategory = async () => {
    const n = newCategoryName.trim();
    if (!n) return;
    const cat = await categoryCreate(n);
    if (cat) {
      setCategories((prev) => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
      setCategoryId(cat.id);
      setNewCategoryName("");
    }
  };

  const addNewTag = async () => {
    const n = newTagName.trim();
    if (!n) return;
    const tag = await tagCreate(n);
    if (tag) {
      setTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)));
      setTagIds((prev) => (prev.includes(tag.id) ? prev : [...prev, tag.id]));
      setNewTagName("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required.");
      return;
    }
    const numPrice = Number(price);
    if (Number.isNaN(numPrice) || numPrice < 0) {
      setError("Enter a valid price.");
      return;
    }
    setSubmitting(true);
    if (mode === "add") {
      const created = await productCreate({
        name: trimmedName,
        description: description.trim() || undefined,
        price: numPrice,
        categoryId: categoryId ?? undefined,
        tagIds: tagIds.length ? tagIds : undefined,
        image: imageFile ?? undefined,
      });
      setSubmitting(false);
      if (created) {
        toast.success("Product added.");
        onSuccess();
      } else {
        setError("Failed to create product. Try again.");
        toast.error("Failed to create product.");
      }
    } else if (product) {
      const updated = await productUpdate(product.id, {
        name: trimmedName,
        description: description.trim() || undefined,
        price: numPrice,
        categoryId: categoryId ?? undefined,
        tagIds,
        image: imageFile ?? undefined,
      });
      setSubmitting(false);
      if (updated) {
        toast.success("Product updated.");
        onSuccess();
      } else {
        setError("Failed to update product. Try again.");
        toast.error("Failed to update product.");
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="settings-card w-full max-w-md rounded-2xl border border-white/10 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-bold text-[var(--brand-white)]">
            {mode === "add" ? "Add product" : "Edit product"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/10 hover:text-[var(--brand-white)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <p className="text-sm text-[var(--brand-red)] bg-[var(--brand-red)]/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-[var(--brand-white)] mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[var(--brand-white)] placeholder:text-neutral-500 focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/30"
              placeholder="Product name"
              maxLength={200}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--brand-white)] mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[var(--brand-white)] placeholder:text-neutral-500 focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/30 resize-none"
              placeholder="Optional description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--brand-white)] mb-1">Category</label>
            <select
              value={categoryId ?? ""}
              onChange={(e) => setCategoryId(e.target.value || null)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[var(--brand-white)] focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/30"
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="mt-1.5 flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category name"
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-[var(--brand-white)] placeholder:text-neutral-500"
              />
              <button type="button" onClick={addNewCategory} className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-[var(--brand-white)] hover:bg-white/20">
                Add
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--brand-white)] mb-1">Tags</label>
            <div className="flex flex-wrap gap-2 mb-1.5">
              {tags.map((t) => (
                <label key={t.id} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm cursor-pointer hover:bg-white/10">
                  <input type="checkbox" checked={tagIds.includes(t.id)} onChange={(e) => setTagIds((prev) => e.target.checked ? [...prev, t.id] : prev.filter((id) => id !== t.id))} />
                  <span className="text-[var(--brand-white)]">{t.name}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="New tag name"
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-[var(--brand-white)] placeholder:text-neutral-500"
              />
              <button type="button" onClick={addNewTag} className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-[var(--brand-white)] hover:bg-white/20">
                Add
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--brand-white)] mb-1">Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price || ""}
              onChange={(e) => setPrice(e.target.value === "" ? 0 : Number(e.target.value))}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[var(--brand-white)] placeholder:text-neutral-500 focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/30"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--brand-white)] mb-1">Image</label>
            <div className="flex items-center gap-4">
              {imagePreview && (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-white/5 shrink-0">
                  <Image src={imagePreview} alt="" fill className="object-cover" />
                </div>
              )}
              <label className="rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-2.5 text-sm text-neutral-400 hover:bg-white/10 cursor-pointer transition-colors">
                <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                {imageFile ? imageFile.name : "Choose image"}
              </label>
            </div>
            {mode === "edit" && product?.imageUrl && !imageFile && (
              <p className="text-xs text-neutral-500 mt-1">Leave unchanged or pick a new image.</p>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-[var(--brand-white)] hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-[var(--brand-blue)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-blue)]/90 disabled:opacity-60 transition-colors"
            >
              {submitting ? "Saving..." : mode === "add" ? "Create" : "Save"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
