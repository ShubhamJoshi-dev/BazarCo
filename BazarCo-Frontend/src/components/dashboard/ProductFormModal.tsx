"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { Product } from "@/types/api";
import {
  categoriesList,
  categoryCreate,
  productCreate,
  productUpdate,
  tagCreate,
  tagsList,
} from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

export function ProductFormModal({
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
  const [sku, setSku] = useState(product?.sku ?? "");
  const [stock, setStock] = useState(product?.stock ?? 50);
  const [brand, setBrand] = useState(product?.brand ?? "");
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
    setSku(product?.sku ?? "");
    setStock(product?.stock ?? 50);
    setBrand(product?.brand ?? "");
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
    const numStock = Math.max(0, Math.floor(Number(stock)) || 0);
    setSubmitting(true);
    const payload = {
      name: trimmedName,
      description: description.trim() || undefined,
      price: numPrice,
      sku: sku.trim() || undefined,
      stock: numStock,
      brand: brand.trim() || undefined,
      categoryId: categoryId ?? undefined,
      tagIds: tagIds.length ? tagIds : undefined,
      image: imageFile ?? undefined,
    };
    if (mode === "add") {
      const { product: created, message } = await productCreate(payload, { publish: true });
      setSubmitting(false);
      if (created) {
        toast.success(message ?? "Product added.");
        onSuccess();
      } else {
        setError(message ?? "Failed to create product. Try again.");
        toast.error(message ?? "Failed to create product.");
      }
    } else if (product) {
      const updated = await productUpdate(product.id, { ...payload, tagIds });
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
        className="settings-card w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--brand-border)] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--brand-border)] px-6 py-4 sticky top-0 bg-[var(--card-bg)] z-10">
          <h2 className="text-lg font-bold text-[var(--foreground)]">
            {mode === "add" ? "Add product" : "Edit product"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-[var(--input-bg)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <p className="text-sm text-[var(--brand-red)] bg-red-50 rounded-lg px-3 py-2 border border-red-100">
              {error}
            </p>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[var(--brand-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm"
              maxLength={200}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">SKU</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full rounded-lg border border-[var(--brand-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm"
                placeholder="Auto-generated if empty"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stock</label>
              <input
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--brand-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Brand</label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full rounded-lg border border-[var(--brand-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-[var(--brand-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={categoryId ?? ""}
              onChange={(e) => setCategoryId(e.target.value || null)}
              className="w-full rounded-lg border border-[var(--brand-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm"
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Price</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price || ""}
              onChange={(e) => setPrice(e.target.value === "" ? 0 : Number(e.target.value))}
              className="w-full rounded-lg border border-[var(--brand-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Image</label>
            <div className="flex items-center gap-4">
              {imagePreview && (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                  <Image src={imagePreview} alt="" fill className="object-cover" />
                </div>
              )}
              <label className="rounded-lg border border-dashed border-[var(--brand-border)] px-3 py-2 text-sm cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                Choose image
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-[var(--brand-red)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Saving…" : mode === "add" ? "Create" : "Save"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
