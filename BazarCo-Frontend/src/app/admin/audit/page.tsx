"use client";

import { useCallback, useEffect, useState } from "react";
import { adminListAuditLogs } from "@/lib/adminApi";
import type { AdminAuditRow } from "@/types/admin";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { TablePaginationBar } from "@/components/dashboard/TablePaginationBar";

export default function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [items, setItems] = useState<AdminAuditRow[]>([]);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    const data = await adminListAuditLogs({ page, limit: pageSize });
    setItems(data?.items ?? []);
    setTotal(data?.pagination.total ?? 0);
  }, [page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Audit log</h2>
        <p className="text-sm text-[var(--brand-muted)] mt-1">Immutable history of admin actions on the platform.</p>
      </div>
      <AdminDataTable
        columns={[
          { key: "when", label: "When" },
          { key: "who", label: "Admin" },
          { key: "action", label: "Action" },
          { key: "ok", label: "Result" },
        ]}
        rows={items.map((row) => ({
          when: new Date(row.createdAt).toLocaleString(),
          who: row.adminUsername ?? "—",
          action: (
            <div>
              <p className="font-mono text-xs">{row.action}</p>
              {row.resourceId && (
                <p className="text-[10px] text-[var(--brand-muted)]">
                  {row.resource}/{row.resourceId}
                </p>
              )}
            </div>
          ),
          ok: row.success === false ? (
            <span className="text-xs text-[var(--brand-red)]">Failed</span>
          ) : (
            <span className="text-xs text-emerald-600">OK</span>
          ),
        }))}
      />
      <TablePaginationBar page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
    </div>
  );
}
