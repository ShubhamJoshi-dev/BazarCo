"use client";

import { motion } from "framer-motion";

export type AdminColumn<T> = {
  key: string;
  label: string;
  className?: string;
  render: (row: T) => React.ReactNode;
};

export function AdminModernTable<T extends { id: string }>({
  columns,
  rows,
  loading,
  emptyMessage,
}: {
  columns: AdminColumn<T>[];
  rows: T[];
  loading?: boolean;
  emptyMessage?: string;
}) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-[var(--card-bg)]">
        <div className="animate-pulse space-y-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 border-b border-[var(--brand-border)] px-5 py-4 last:border-0">
              <div className="h-10 flex-1 rounded-lg bg-[var(--input-bg)]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--brand-border)] bg-[var(--card-bg)]/50 px-6 py-16 text-center">
        <p className="text-sm text-[var(--brand-muted)]">{emptyMessage ?? "No records found."}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-[var(--card-bg)] shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-[var(--brand-border)] bg-[var(--input-bg)]/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--brand-muted)] ${col.className ?? ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
                className="group border-b border-[var(--brand-border)]/70 transition-colors last:border-0 hover:bg-[var(--input-bg)]/40"
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-5 py-4 align-middle text-sm ${col.className ?? ""}`}>
                    {col.render(row)}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
