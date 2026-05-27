"use client";

export function AdminDataTable({
  columns,
  rows,
  emptyMessage = "No records found.",
}: {
  columns: { key: string; label: string; className?: string }[];
  rows: Record<string, React.ReactNode>[];
  emptyMessage?: string;
}) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-[var(--brand-border)] bg-[var(--input-bg)]/40 px-4 py-12 text-center text-sm text-[var(--brand-muted)]">
        {emptyMessage}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--brand-border)]">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--brand-border)] bg-[var(--input-bg)]/60 text-left text-xs uppercase tracking-wide text-[var(--brand-muted)]">
            {columns.map((col) => (
              <th key={col.key} className={`px-4 py-3 font-medium ${col.className ?? ""}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[var(--brand-border)]/60 hover:bg-[var(--input-bg)]/30">
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 align-middle ${col.className ?? ""}`}>
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
