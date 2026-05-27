"use client";

const STYLES: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-600 ring-emerald-500/25",
  draft: "bg-slate-500/15 text-slate-600 dark:text-slate-300 ring-slate-500/25",
  archived: "bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-amber-500/25",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-amber-500/25",
  verified: "bg-emerald-500/15 text-emerald-600 ring-emerald-500/25",
  rejected: "bg-red-500/15 text-[var(--brand-red)] ring-red-500/25",
  suspended: "bg-orange-500/15 text-orange-600 ring-orange-500/25",
  deleted: "bg-red-500/15 text-[var(--brand-red)] ring-red-500/25",
  flagged: "bg-red-500/15 text-[var(--brand-red)] ring-red-500/25",
  buyer: "bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-sky-500/25",
  seller: "bg-violet-500/15 text-violet-700 dark:text-violet-300 ring-violet-500/25",
  rider: "bg-teal-500/15 text-teal-700 dark:text-teal-300 ring-teal-500/25",
};

export function AdminStatusBadge({ status, label }: { status: string; label?: string }) {
  const key = status.toLowerCase();
  const style = STYLES[key] ?? "bg-[var(--input-bg)] text-[var(--brand-muted)] ring-[var(--brand-border)]";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ${style}`}>
      {label ?? status}
    </span>
  );
}
