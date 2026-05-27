"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Eye, Flag, Package, RefreshCw, RotateCcw, Search, Trash2 } from "lucide-react";
import {
  adminFlagProduct,
  adminGetProduct,
  adminListProducts,
  adminRestoreProduct,
  adminSoftDeleteProduct,
} from "@/lib/adminApi";
import type { AdminProductRow } from "@/types/admin";
import { AdminPageShell } from "@/components/admin/ui/AdminPageShell";
import { AdminModernTable } from "@/components/admin/ui/AdminModernTable";
import { AdminStatusBadge } from "@/components/admin/ui/AdminStatusBadge";
import { AdminActionBtn } from "@/components/admin/ui/AdminActionBtn";
import { AdminSlidePanel } from "@/components/admin/ui/AdminSlidePanel";
import { TablePaginationBar } from "@/components/dashboard/TablePaginationBar";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useToast } from "@/contexts/ToastContext";

export default function AdminProductsPage() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [flagged, setFlagged] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewId, setViewId] = useState<string | null>(null);
  const [viewProduct, setViewProduct] = useState<AdminProductRow | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmFlag, setConfirmFlag] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const query: Record<string, string | number> = { page, limit: pageSize };
    if (q) query.q = q;
    if (flagged) query.flagged = flagged;
    if (statusFilter) query.status = statusFilter;
    const data = await adminListProducts(query);
    setProducts(data?.products ?? []);
    setTotal(data?.pagination.total ?? 0);
    setLoading(false);
  }, [page, pageSize, q, flagged, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!viewId) {
      setViewProduct(null);
      return;
    }
    setViewLoading(true);
    void adminGetProduct(viewId).then((p) => {
      setViewProduct(p);
      setViewLoading(false);
    });
  }, [viewId]);

  async function handleDelete() {
    if (!confirmDelete) return;
    const ok = await adminSoftDeleteProduct(confirmDelete);
    setConfirmDelete(null);
    if (ok) {
      toast.success("Product removed");
      setViewId(null);
      void load();
    } else toast.error("Delete failed");
  }

  async function handleFlag() {
    if (!confirmFlag) return;
    const ok = await adminFlagProduct(confirmFlag, true, "Flagged from admin panel");
    setConfirmFlag(null);
    if (ok) {
      toast.success("Product flagged");
      void load();
      if (viewId === confirmFlag) void adminGetProduct(confirmFlag).then(setViewProduct);
    } else toast.error("Could not flag");
  }

  return (
    <AdminPageShell
      title="Product management"
      description="Browse listings, view details, flag violations, and soft-delete products."
      icon={Package}
      toolbar={
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--brand-muted)]" />
            <input
              placeholder="Search by product name…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (setQ(searchInput), setPage(1))}
              className="clay-input w-full py-2.5 pl-10"
            />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="clay-input sm:w-36">
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <select value={flagged} onChange={(e) => { setFlagged(e.target.value); setPage(1); }} className="clay-input sm:w-36">
            <option value="">All products</option>
            <option value="true">Flagged</option>
          </select>
          <button type="button" onClick={() => { setQ(searchInput); setPage(1); }} className="clay-btn-blue inline-flex items-center gap-2 px-4 py-2.5 text-sm">
            <Search className="h-4 w-4" />
            Search
          </button>
          <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-[var(--brand-border)] px-4 py-2.5 text-sm font-semibold hover:bg-[var(--input-bg)]">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      }
    >
      <AdminModernTable
        loading={loading}
        emptyMessage="No products found."
        columns={[
          {
            key: "product",
            label: "Product",
            render: (p) => (
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[var(--brand-border)] bg-[var(--input-bg)]">
                  {p.imageUrl ? (
                    <Image src={p.imageUrl} alt="" fill className="object-cover" sizes="48px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[var(--brand-muted)]">
                      <Package className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate max-w-[200px] sm:max-w-xs">{p.name}</p>
                  <div className="mt-0.5 flex gap-1.5 flex-wrap">
                    {p.flagged && <AdminStatusBadge status="flagged" label="Flagged" />}
                    {p.featured && <span className="text-[10px] font-bold text-[var(--brand-blue)]">FEATURED</span>}
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (p) => <AdminStatusBadge status={p.status} />,
          },
          {
            key: "price",
            label: "Price",
            render: (p) => <span className="font-semibold tabular-nums">रू {p.price.toLocaleString()}</span>,
          },
          {
            key: "stock",
            label: "Stock",
            render: (p) => <span className="text-[var(--brand-muted)]">{p.stock ?? 0}</span>,
          },
          {
            key: "actions",
            label: "Actions",
            className: "text-right",
            render: (p) => (
              <div className="flex justify-end gap-1.5 flex-wrap">
                <AdminActionBtn icon={Eye} label="View" variant="primary" onClick={() => setViewId(p.id)} />
                {!p.deletedAt && (
                  <>
                    {!p.flagged && <AdminActionBtn icon={Flag} label="Flag" variant="warn" onClick={() => setConfirmFlag(p.id)} />}
                    <AdminActionBtn icon={Trash2} label="Delete" variant="danger" onClick={() => setConfirmDelete(p.id)} />
                  </>
                )}
              </div>
            ),
          },
        ]}
        rows={products}
      />

      <TablePaginationBar page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />

      <AdminSlidePanel
        open={!!viewId}
        title={viewProduct?.name ?? "Product"}
        subtitle={viewProduct ? `ID · ${viewProduct.id.slice(-8)}` : undefined}
        onClose={() => setViewId(null)}
        footer={
          viewProduct && !viewProduct.deletedAt ? (
            <div className="flex flex-wrap gap-2">
              {!viewProduct.flagged && (
                <button type="button" onClick={() => setConfirmFlag(viewProduct.id)} className="flex-1 rounded-xl border border-amber-500/40 py-2.5 text-sm font-semibold text-amber-600 hover:bg-amber-500/10">
                  Flag product
                </button>
              )}
              <button type="button" onClick={() => setConfirmDelete(viewProduct.id)} className="flex-1 clay-btn-red py-2.5 text-sm">
                Soft delete
              </button>
            </div>
          ) : viewProduct?.deletedAt ? (
            <button
              type="button"
              onClick={() => void adminRestoreProduct(viewProduct.id).then((ok) => { if (ok) { toast.success("Restored"); void load(); setViewId(null); } })}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 py-2.5 text-sm font-semibold text-emerald-600 hover:bg-emerald-500/10"
            >
              <RotateCcw className="h-4 w-4" />
              Restore product
            </button>
          ) : undefined
        }
      >
        {viewLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="aspect-square max-h-64 rounded-2xl bg-[var(--input-bg)]" />
          </div>
        ) : viewProduct ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="relative mx-auto aspect-square max-h-72 w-full overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-[var(--input-bg)]">
              {viewProduct.imageUrl ? (
                <Image src={viewProduct.imageUrl} alt={viewProduct.name} fill className="object-contain p-2" sizes="400px" />
              ) : (
                <div className="flex h-full items-center justify-center text-[var(--brand-muted)]">
                  <Package className="h-16 w-16 opacity-40" />
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <AdminStatusBadge status={viewProduct.status} />
              {viewProduct.deletedAt && <AdminStatusBadge status="deleted" />}
              {viewProduct.flagged && <AdminStatusBadge status="flagged" />}
            </div>
            <p className="text-2xl font-bold tabular-nums">रू {viewProduct.price.toLocaleString()}</p>
            {viewProduct.description && (
              <p className="text-sm leading-relaxed text-[var(--brand-muted)]">{viewProduct.description}</p>
            )}
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {[
                ["Stock", String(viewProduct.stock ?? 0)],
                ["SKU", viewProduct.sku ?? "—"],
                ["Brand", viewProduct.brand ?? "—"],
                ["Seller ID", viewProduct.sellerId.slice(-8) + "…"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-[var(--brand-border)] bg-[var(--input-bg)]/30 px-3 py-2.5">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">{k}</dt>
                  <dd className="mt-0.5 font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </motion.div>
        ) : (
          <p className="text-sm text-[var(--brand-muted)]">Product not found.</p>
        )}
      </AdminSlidePanel>

      <ConfirmModal open={!!confirmDelete} title="Soft delete product?" message="The listing will be hidden from the marketplace. You can restore it later." confirmLabel="Delete" onConfirm={() => void handleDelete()} onCancel={() => setConfirmDelete(null)} />
      <ConfirmModal open={!!confirmFlag} title="Flag this product?" message="Flagged products appear in moderation queues for review." confirmLabel="Flag" variant="default" onConfirm={() => void handleFlag()} onCancel={() => setConfirmFlag(null)} />
    </AdminPageShell>
  );
}
