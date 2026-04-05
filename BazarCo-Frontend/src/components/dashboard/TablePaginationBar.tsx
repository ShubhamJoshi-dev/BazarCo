"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50] as const;

type Props = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  /** If false, page size selector is hidden (fixed page size). */
  showSizeSelector?: boolean;
  sizeOptions?: readonly number[];
};

export function TablePaginationBar({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  showSizeSelector = true,
  sizeOptions = PAGE_SIZE_OPTIONS,
}: Props) {
  if (total <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-white/10 mt-4">
      <p className="text-xs text-neutral-500">
        Showing <span className="text-neutral-300 font-medium">{from}</span>–
        <span className="text-neutral-300 font-medium">{to}</span> of{" "}
        <span className="text-neutral-300 font-medium">{total}</span>
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {showSizeSelector && (
          <label className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="shrink-0">Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1.5 text-sm text-[var(--brand-white)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/40"
            >
              {sizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous page"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-neutral-300 hover:bg-white/[0.08] disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="min-w-[5.5rem] text-center text-xs text-neutral-400 tabular-nums px-1">
            Page {safePage} / {totalPages}
          </span>
          <button
            type="button"
            aria-label="Next page"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-neutral-300 hover:bg-white/[0.08] disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

