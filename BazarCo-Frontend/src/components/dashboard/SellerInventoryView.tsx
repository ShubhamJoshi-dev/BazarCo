"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  ClipboardList,
  Clock,
  Download,
  ImageIcon,
  Pencil,
  Plus,
  Rocket,
  Trash2,
  TrendingUp,
  Upload,
} from "lucide-react";
import type { Product } from "@/types/api";
import {
  categoriesList,
  getKycStatus,
  productDelete,
  productPublish,
  productsList,
  type KycStatusResponse,
} from "@/lib/api";
import { SellerKycPublishBanner } from "@/components/dashboard/SellerKycPublishBanner";
import {
  displayMarginPercent,
  formatRelativeUpdated,
  getStockLevel,
  productSku,
  type StockLevel,
} from "@/lib/inventory";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useToast } from "@/contexts/ToastContext";
import { ConfirmModal } from "@/components/ConfirmModal";

const PAGE_SIZE = 10;

type StatusFilter = "all" | "active" | "archived" | "draft" | StockLevel;

const STOCK_PILL: Record<
  StockLevel,
  { labelKey: string; className: string }
> = {
  in_stock: { labelKey: "stockIn", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  low_stock: { labelKey: "stockLow", className: "bg-red-50 text-red-800 border-red-200" },
  out_of_stock: { labelKey: "stockOut", className: "bg-neutral-100 text-neutral-600 border-neutral-200" },
};

function exportInventoryCsv(rows: Product[]) {
  const headers = ["Name", "SKU", "Category", "Brand", "Price", "Stock", "Status"];
  const lines = [
    headers.join(","),
    ...rows.map((p) =>
      [
        `"${p.name.replace(/"/g, '""')}"`,
        productSku(p),
        `"${(p.category ?? "").replace(/"/g, '""')}"`,
        `"${(p.brand ?? "").replace(/"/g, '""')}"`,
        String(p.price),
        String(p.stock ?? 0),
        p.status,
      ].join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function SellerInventoryView() {
  const t = useTranslations("sellerInventory");
  const toast = useToast();
  const { formatPrice } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [page, setPage] = useState(1);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [kycVerified, setKycVerified] = useState<boolean | null>(null);
  const [kycStatus, setKycStatus] = useState<KycStatusResponse["status"] | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkHint, setBulkHint] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await productsList();
    setProducts(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    getKycStatus().then((k) => {
      setKycVerified(k?.kycVerified ?? false);
      setKycStatus(k?.status ?? "pending");
    });
    categoriesList().then(setCategories);
  }, [load]);

  const brands = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.brand?.trim()) set.add(p.brand.trim());
    }
    return [...set].sort();
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter && p.categoryId !== categoryFilter) return false;
      if (brandFilter && (p.brand ?? "") !== brandFilter) return false;
      if (statusFilter === "active" && p.status !== "active") return false;
      if (statusFilter === "archived" && p.status !== "archived") return false;
      if (statusFilter === "draft" && p.status !== "draft") return false;
      if (statusFilter === "in_stock" || statusFilter === "low_stock" || statusFilter === "out_of_stock") {
        if (getStockLevel(p) !== statusFilter) return false;
      }
      return true;
    });
  }, [products, categoryFilter, brandFilter, statusFilter]);

  const kpis = useMemo(() => {
    const active = products.filter((p) => p.status === "active");
    const drafts = products.filter((p) => p.status === "draft").length;
    const lowStock = active.filter((p) => getStockLevel(p) === "low_stock").length;
    const outOfStock = products.filter((p) => getStockLevel(p) === "out_of_stock").length;
    const stockValue = active.reduce((s, p) => s + Number(p.price) * (p.stock ?? 0), 0);
    return {
      total: products.length,
      drafts,
      lowStock,
      stockValue,
      outOfStock,
    };
  }, [products]);

  const handlePublish = async (product: Product) => {
    if (!kycVerified) {
      toast.error(t("publishFailed"));
      return;
    }
    setPublishingId(product.id);
    const { product: published, message } = await productPublish(product.id);
    setPublishingId(null);
    if (published) {
      toast.success(t("publishedToast"));
      load();
    } else {
      toast.error(message ?? t("publishFailed"));
    }
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [categoryFilter, brandFilter, statusFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map((p) => p.id)));
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    const ok = await productDelete(productToDelete.id);
    setDeleting(false);
    setProductToDelete(null);
    if (ok) {
      toast.success("Product deleted.");
      load();
    } else toast.error("Could not delete product.");
  };

  return (
    <div className="space-y-6 w-full pb-8">
      <SellerKycPublishBanner kycVerified={kycVerified} kycStatus={kycStatus} />

      {bulkHint && (
        <p className="text-sm text-[var(--brand-blue)] bg-blue-50 border border-blue-100 rounded-lg px-4 py-2">
          {t("bulkComingSoon")}
        </p>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{t("title")}</h1>
          <p className="mt-1 text-sm text-[var(--brand-muted)]">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportInventoryCsv(filtered)}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--brand-border)] bg-[var(--card-bg)] px-4 py-2.5 text-sm font-semibold hover:bg-[var(--input-bg)]"
          >
            <Download className="h-4 w-4" />
            {t("exportCsv")}
          </button>
          <button
            type="button"
            onClick={() => setBulkHint(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-red)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-red)]/90"
          >
            <Upload className="h-4 w-4" />
            {t("bulkUpload")}
          </button>
          <Link
            href="/dashboard/products/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-red)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#b71c1c] transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t("addProduct")}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {[
          { label: t("kpiTotal"), value: kpis.total.toLocaleString(), icon: ClipboardList, iconBg: "bg-blue-100 text-blue-600" },
          {
            label: t("statusDraftShort"),
            value: t("draftCount", { count: kpis.drafts }),
            icon: Clock,
            iconBg: "bg-amber-100 text-amber-700",
          },
          { label: t("kpiLowStock"), value: `${kpis.lowStock} ${t("items")}`, icon: AlertTriangle, iconBg: "bg-red-100 text-red-600" },
          {
            label: t("kpiStockValue"),
            value: formatPrice(kpis.stockValue),
            icon: TrendingUp,
            iconBg: "bg-emerald-100 text-emerald-600",
          },
          { label: t("kpiOutOfStock"), value: `${kpis.outOfStock} ${t("items")}`, icon: Clock, iconBg: "bg-amber-100 text-amber-600" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="clay-card p-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-[var(--brand-muted)]">{card.label}</p>
                <p className="mt-2 text-2xl font-bold tabular-nums">{card.value}</p>
              </div>
              <div className={`rounded-xl p-2.5 ${card.iconBg}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="clay-card overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--brand-border)] px-5 py-4">
          <div className="flex flex-wrap gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-[var(--brand-border)] bg-[var(--input-bg)] px-3 py-2 text-sm"
            >
              <option value="">{t("categoryAll")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="rounded-lg border border-[var(--brand-border)] bg-[var(--input-bg)] px-3 py-2 text-sm"
            >
              <option value="">{t("brandAll")}</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded-lg border border-[var(--brand-border)] bg-[var(--input-bg)] px-3 py-2 text-sm"
            >
              <option value="all">{t("statusAll")}</option>
              <option value="active">{t("statusActive")}</option>
              <option value="draft">{t("statusDraft")}</option>
              <option value="archived">{t("statusArchived")}</option>
              <option value="in_stock">{t("stockIn")}</option>
              <option value="low_stock">{t("stockLow")}</option>
              <option value="out_of_stock">{t("stockOut")}</option>
            </select>
          </div>
          <p className="text-xs text-neutral-500">
            {t("showingProducts", {
              from: filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0,
              to: Math.min(page * PAGE_SIZE, filtered.length),
              total: filtered.length,
            })}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--brand-border)] bg-[var(--input-bg)]/40 text-left">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && selected.size === paginated.length}
                    onChange={toggleSelectAll}
                    className="rounded border-neutral-300"
                    aria-label={t("selectAll")}
                  />
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-[var(--brand-muted)]">{t("colProduct")}</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-[var(--brand-muted)]">{t("colSku")}</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-[var(--brand-muted)]">{t("colPrice")}</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-[var(--brand-muted)]">{t("colStock")}</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-[var(--brand-muted)]">{t("colUpdated")}</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-[var(--brand-muted)]">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-neutral-500">
                    {t("loading")}
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-neutral-500">
                    {t("noProducts")}
                  </td>
                </tr>
              ) : (
                paginated.map((p) => {
                  const isDraft = p.status === "draft";
                  const level = getStockLevel(p);
                  const pill = STOCK_PILL[level];
                  const stock = p.stock ?? 0;
                  return (
                    <tr key={p.id} className="border-b border-[var(--brand-border)] hover:bg-[var(--row-hover)]">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="rounded border-neutral-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div className="h-11 w-11 shrink-0 rounded-lg bg-[var(--input-bg)] overflow-hidden relative border border-[var(--brand-border)]">
                            {p.imageUrl ? (
                              <Image src={p.imageUrl} alt="" fill className="object-cover" sizes="44px" />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
                                <ImageIcon className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-[var(--foreground)] truncate">{p.name}</p>
                              {isDraft && (
                                <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                                  {t("statusDraftShort")}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-500 truncate">{p.category ?? t("uncategorized")}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-neutral-600 whitespace-nowrap">
                        {productSku(p)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-bold tabular-nums">{formatPrice(Number(p.price))}</p>
                        <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">
                          {displayMarginPercent(Number(p.price))}% {t("margin")}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {isDraft ? (
                          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                            {t("statusDraft")}
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${pill.className}`}
                          >
                            {t(pill.labelKey)}
                            {level !== "out_of_stock" && ` (${stock})`}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-500 whitespace-nowrap text-xs">
                        {formatRelativeUpdated(p.updatedAt ?? p.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {isDraft && (
                            <button
                              type="button"
                              disabled={!kycVerified || publishingId === p.id}
                              onClick={() => handlePublish(p)}
                              title={kycVerified ? t("publish") : t("publishFailed")}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Rocket className="h-3.5 w-3.5" />
                              {t("publish")}
                            </button>
                          )}
                          <Link
                            href={`/dashboard/products/${p.id}/edit`}
                            className="p-2 rounded-lg text-neutral-500 hover:bg-[var(--input-bg)] hover:text-[var(--brand-blue)]"
                            aria-label={t("edit")}
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setProductToDelete(p)}
                            className="p-2 rounded-lg text-neutral-500 hover:bg-red-50 hover:text-[var(--brand-red)]"
                            aria-label={t("delete")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-t border-[var(--brand-border)]">
          <p className="text-xs text-neutral-500">
            {t("pageOf", { page, total: totalPages })}
          </p>
          <div className="flex items-center gap-1 flex-wrap justify-end">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`min-w-[2rem] h-8 rounded-md text-sm font-medium ${
                  p === page ? "bg-[var(--brand-red)] text-white" : "text-neutral-600 hover:bg-[var(--input-bg)]"
                }`}
              >
                {p}
              </button>
            ))}
            {totalPages > 7 && <span className="px-1 text-neutral-400">…</span>}
          </div>
        </div>
      </div>

      <footer className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-neutral-500">
        <span>{t("footerCopy")}</span>
        <div className="flex flex-wrap gap-4">
          <span>{t("privacy")}</span>
          <span>{t("terms")}</span>
          <span>{t("merchant")}</span>
        </div>
      </footer>

      <ConfirmModal
        open={productToDelete !== null}
        title={t("deleteTitle")}
        message={productToDelete ? t("deleteMessage", { name: productToDelete.name }) : ""}
        confirmLabel={t("delete")}
        variant="danger"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => !deleting && setProductToDelete(null)}
      />
    </div>
  );
}
