"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Search, UserCircle, UserX, RotateCcw, Eye } from "lucide-react";
import {
  adminGetUser,
  adminListUsers,
  adminRestoreUser,
  adminSoftDeleteUser,
  adminSuspendUser,
} from "@/lib/adminApi";
import type { AdminPlatformUser } from "@/types/admin";
import { AdminPageShell } from "@/components/admin/ui/AdminPageShell";
import { AdminModernTable } from "@/components/admin/ui/AdminModernTable";
import { AdminStatusBadge } from "@/components/admin/ui/AdminStatusBadge";
import { AdminActionBtn } from "@/components/admin/ui/AdminActionBtn";
import { AdminSlidePanel } from "@/components/admin/ui/AdminSlidePanel";
import { TablePaginationBar } from "@/components/dashboard/TablePaginationBar";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useToast } from "@/contexts/ToastContext";

function userStatus(u: AdminPlatformUser) {
  if (u.deletedAt) return "deleted";
  if (u.suspendedAt) return "suspended";
  return "active";
}

export default function AdminUsersPage() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [users, setUsers] = useState<AdminPlatformUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<{ action: "suspend" | "delete"; id: string } | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [viewUser, setViewUser] = useState<AdminPlatformUser | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await adminListUsers({ page, limit: pageSize, q, role });
    setUsers(data?.users ?? []);
    setTotal(data?.pagination.total ?? 0);
    setLoading(false);
  }, [page, pageSize, q, role]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!viewId) {
      setViewUser(null);
      return;
    }
    setViewLoading(true);
    void adminGetUser(viewId).then((u) => {
      setViewUser(u);
      setViewLoading(false);
    });
  }, [viewId]);

  async function runConfirm() {
    if (!confirm) return;
    setLoading(true);
    let ok = false;
    if (confirm.action === "suspend") ok = await adminSuspendUser(confirm.id);
    if (confirm.action === "delete") ok = await adminSoftDeleteUser(confirm.id);
    setConfirm(null);
    if (ok) {
      toast.success("Action completed");
      void load();
      if (viewId === confirm.id) setViewId(null);
    } else toast.error("Action failed");
    setLoading(false);
  }

  return (
    <AdminPageShell
      title="User management"
      description="Search, review, suspend, restore, or soft-delete marketplace accounts."
      icon={UserCircle}
      toolbar={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--brand-muted)]" />
            <input
              placeholder="Search email, name, phone…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (setQ(searchInput), setPage(1))}
              className="clay-input w-full py-2.5 pl-10"
            />
          </div>
          <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} className="clay-input sm:w-40">
            <option value="">All roles</option>
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
            <option value="rider">Rider</option>
          </select>
          <button
            type="button"
            onClick={() => { setQ(searchInput); setPage(1); void load(); }}
            className="clay-btn-blue inline-flex items-center gap-2 px-4 py-2.5 text-sm"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
          <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-[var(--brand-border)] px-4 py-2.5 text-sm font-semibold hover:bg-[var(--input-bg)]">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      }
    >
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <AdminModernTable
          loading={loading}
          emptyMessage="No users match your filters."
          columns={[
            {
              key: "user",
              label: "User",
              render: (u) => (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand-blue)]/20 to-[var(--brand-red)]/10 text-sm font-bold text-[var(--brand-blue)]">
                    {(u.name?.[0] ?? u.email[0])?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{u.email}</p>
                    {u.name && <p className="text-xs text-[var(--brand-muted)]">{u.name}</p>}
                  </div>
                </div>
              ),
            },
            {
              key: "role",
              label: "Role",
              render: (u) => <AdminStatusBadge status={u.role} />,
            },
            {
              key: "status",
              label: "Status",
              render: (u) => <AdminStatusBadge status={userStatus(u)} />,
            },
            {
              key: "actions",
              label: "Actions",
              className: "text-right",
              render: (u) => (
                <div className="flex justify-end gap-1.5 flex-wrap">
                  <AdminActionBtn icon={Eye} label="View" variant="primary" onClick={() => setViewId(u.id)} />
                  {u.deletedAt ? (
                    <AdminActionBtn icon={RotateCcw} label="Restore" variant="success" onClick={() => void adminRestoreUser(u.id).then(() => { toast.success("Restored"); void load(); })} />
                  ) : (
                    <>
                      <AdminActionBtn icon={UserX} label="Suspend" variant="warn" onClick={() => setConfirm({ action: "suspend", id: u.id })} />
                      <AdminActionBtn icon={UserX} label="Delete" variant="danger" onClick={() => setConfirm({ action: "delete", id: u.id })} />
                    </>
                  )}
                </div>
              ),
            },
          ]}
          rows={users}
        />
      </motion.div>

      <TablePaginationBar page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />

      <AdminSlidePanel
        open={!!viewId}
        title="User details"
        subtitle={viewUser?.email}
        onClose={() => setViewId(null)}
      >
        {viewLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-24 rounded-xl bg-[var(--input-bg)]" />
            <div className="h-4 w-2/3 rounded bg-[var(--input-bg)]" />
          </div>
        ) : viewUser ? (
          <dl className="space-y-4 text-sm">
            <div className="rounded-xl border border-[var(--brand-border)] bg-[var(--input-bg)]/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[var(--brand-muted)]">Status</span>
                <AdminStatusBadge status={userStatus(viewUser)} />
              </div>
            </div>
            {[
              ["Name", viewUser.name ?? "—"],
              ["Role", viewUser.role],
              ["KYC verified", viewUser.kycVerified ? "Yes" : "No"],
              ["Email verified", viewUser.emailVerified !== false ? "Yes" : "No"],
              ["Messaging banned", viewUser.messagingBanned ? "Yes" : "No"],
              ["Created", viewUser.createdAt ? new Date(viewUser.createdAt).toLocaleString() : "—"],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-[var(--brand-border)]/60 pb-3">
                <dt className="text-[var(--brand-muted)]">{label}</dt>
                <dd className="font-medium text-right capitalize">{val}</dd>
              </div>
            ))}
            {viewUser.suspendedReason && (
              <div className="rounded-lg bg-amber-500/10 px-3 py-2 text-amber-700 text-xs">{viewUser.suspendedReason}</div>
            )}
          </dl>
        ) : (
          <p className="text-sm text-[var(--brand-muted)]">Could not load user.</p>
        )}
      </AdminSlidePanel>

      <ConfirmModal
        open={!!confirm}
        title={confirm?.action === "delete" ? "Soft delete user?" : "Suspend user?"}
        message="Suspended users are logged out. Soft delete hides the account but allows restore."
        confirmLabel={confirm?.action === "delete" ? "Soft delete" : "Suspend"}
        onConfirm={() => void runConfirm()}
        onCancel={() => setConfirm(null)}
        loading={loading}
      />
    </AdminPageShell>
  );
}
