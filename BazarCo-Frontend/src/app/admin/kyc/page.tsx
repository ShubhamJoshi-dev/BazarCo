"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ExternalLink, FileText, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { adminApproveKyc, adminGetKycDetail, adminListKyc, adminRejectKyc } from "@/lib/adminApi";
import type { AdminKycDetail, AdminKycRow } from "@/types/admin";
import { AdminPageShell } from "@/components/admin/ui/AdminPageShell";
import { AdminModernTable } from "@/components/admin/ui/AdminModernTable";
import { AdminStatusBadge } from "@/components/admin/ui/AdminStatusBadge";
import { AdminActionBtn } from "@/components/admin/ui/AdminActionBtn";
import { AdminSlidePanel } from "@/components/admin/ui/AdminSlidePanel";
import { TablePaginationBar } from "@/components/dashboard/TablePaginationBar";
import { useToast } from "@/contexts/ToastContext";

const TABS = [
  { id: "pending", label: "Pending" },
  { id: "verified", label: "Verified" },
  { id: "rejected", label: "Rejected" },
] as const;

export default function AdminKycPage() {
  const toast = useToast();
  const [status, setStatus] = useState<string>("pending");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [rows, setRows] = useState<AdminKycRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewId, setViewId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminKycDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await adminListKyc({ page, limit: pageSize, status });
    setRows(data?.submissions ?? []);
    setTotal(data?.pagination.total ?? 0);
    setLoading(false);
  }, [page, pageSize, status]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!viewId) {
      setDetail(null);
      setRejectOpen(false);
      return;
    }
    setDetailLoading(true);
    void adminGetKycDetail(viewId).then((d) => {
      setDetail(d);
      setDetailLoading(false);
    });
  }, [viewId]);

  async function approve(id: string) {
    setActionLoading(true);
    const ok = await adminApproveKyc(id);
    setActionLoading(false);
    if (ok) {
      toast.success("KYC approved");
      setViewId(null);
      void load();
    } else toast.error("Approval failed");
  }

  async function confirmReject() {
    if (!viewId) return;
    setActionLoading(true);
    const ok = await adminRejectKyc(viewId, rejectNote || "Does not meet verification requirements");
    setActionLoading(false);
    setRejectOpen(false);
    setRejectNote("");
    if (ok) {
      toast.success("KYC rejected");
      setViewId(null);
      void load();
    } else toast.error("Rejection failed");
  }

  return (
    <AdminPageShell
      title="KYC management"
      description="Review seller identity documents, approve verified sellers, or reject with notes."
      icon={ShieldCheck}
      toolbar={
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex rounded-xl border border-[var(--brand-border)] bg-[var(--input-bg)]/50 p-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setStatus(tab.id); setPage(1); }}
                className={`relative rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  status === tab.id ? "text-white" : "text-[var(--brand-muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {status === tab.id && (
                  <motion.span
                    layoutId="kyc-tab"
                    className="absolute inset-0 rounded-lg bg-[var(--brand-red)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-[var(--brand-border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--input-bg)]">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      }
    >
      <AdminModernTable
        loading={loading}
        emptyMessage={`No ${status} KYC submissions.`}
        columns={[
          {
            key: "seller",
            label: "Seller",
            render: (r) => (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-blue)]/15 text-[var(--brand-blue)]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{r.user?.email ?? r.userId}</p>
                  <p className="text-xs text-[var(--brand-muted)]">{r.user?.name ?? "Seller"}</p>
                </div>
              </div>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (r) => <AdminStatusBadge status={r.status} />,
          },
          {
            key: "date",
            label: "Submitted",
            render: (r) => (
              <span className="text-[var(--brand-muted)] text-xs">
                {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
              </span>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            className: "text-right",
            render: (r) => (
              <div className="flex justify-end gap-1.5">
                <AdminActionBtn icon={FileText} label="Review" variant="primary" onClick={() => setViewId(r.id)} />
                {r.status === "pending" && (
                  <>
                    <AdminActionBtn icon={CheckCircle2} label="Approve" variant="success" onClick={() => void approve(r.id)} />
                    <AdminActionBtn icon={XCircle} label="Reject" variant="danger" onClick={() => { setViewId(r.id); setRejectOpen(true); }} />
                  </>
                )}
              </div>
            ),
          },
        ]}
        rows={rows}
      />

      <TablePaginationBar page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />

      <AdminSlidePanel
        open={!!viewId}
        title="KYC review"
        subtitle={detail?.user?.email}
        onClose={() => { setViewId(null); setRejectOpen(false); }}
        footer={
          detail?.status === "pending" && !rejectOpen ? (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => void approve(detail.id)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-600/90 disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </button>
              <button
                type="button"
                onClick={() => setRejectOpen(true)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--brand-red)]/50 py-3 text-sm font-semibold text-[var(--brand-red)] hover:bg-[var(--brand-red)]/10"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
            </div>
          ) : undefined
        }
      >
        {detailLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-40 rounded-xl bg-[var(--input-bg)]" />
            <div className="h-32 rounded-xl bg-[var(--input-bg)]" />
          </div>
        ) : detail ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div className="flex items-center justify-between rounded-xl border border-[var(--brand-border)] bg-[var(--input-bg)]/40 p-4">
              <span className="text-sm text-[var(--brand-muted)]">Verification status</span>
              <AdminStatusBadge status={detail.status} />
            </div>

            {detail.user && (
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div className="rounded-lg border border-[var(--brand-border)] px-3 py-2">
                  <dt className="text-xs text-[var(--brand-muted)]">Name</dt>
                  <dd className="font-medium">{detail.user.name ?? "—"}</dd>
                </div>
                <div className="rounded-lg border border-[var(--brand-border)] px-3 py-2">
                  <dt className="text-xs text-[var(--brand-muted)]">Role</dt>
                  <dd className="font-medium capitalize">{detail.user.role}</dd>
                </div>
              </dl>
            )}

            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--brand-muted)] mb-3">Documents</h4>
              {detail.documents?.length ? (
                <div className="space-y-4">
                  {detail.documents.map((doc) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="overflow-hidden rounded-xl border border-[var(--brand-border)]"
                    >
                      <div className="flex items-center justify-between border-b border-[var(--brand-border)] bg-[var(--input-bg)]/50 px-3 py-2">
                        <span className="text-xs font-semibold capitalize">{doc.documentType.replace("_", " ")}</span>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-blue)] hover:underline"
                        >
                          Open <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div className="relative aspect-[4/3] bg-[var(--input-bg)]">
                        <Image src={doc.fileUrl} alt={doc.documentType} fill className="object-contain p-2" sizes="400px" unoptimized />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--brand-muted)]">No documents attached.</p>
              )}
            </div>

            {detail.rejectionReason && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-[var(--brand-red)]">
                <strong>Rejection note:</strong> {detail.rejectionReason}
              </div>
            )}

            <AnimatePresence>
              {rejectOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden rounded-xl border border-[var(--brand-red)]/30 bg-[var(--brand-red)]/5 p-4"
                >
                  <p className="text-sm font-semibold text-[var(--brand-red)]">Rejection reason</p>
                  <textarea
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    className="clay-input mt-2 w-full min-h-[88px] text-sm"
                    placeholder="Explain what the seller should fix…"
                  />
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => setRejectOpen(false)} className="flex-1 rounded-lg border border-[var(--brand-border)] py-2 text-sm">
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => void confirmReject()}
                      className="flex-1 clay-btn-red py-2 text-sm disabled:opacity-60"
                    >
                      Confirm reject
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <p className="text-sm text-[var(--brand-muted)]">Could not load KYC details.</p>
        )}
      </AdminSlidePanel>
    </AdminPageShell>
  );
}
