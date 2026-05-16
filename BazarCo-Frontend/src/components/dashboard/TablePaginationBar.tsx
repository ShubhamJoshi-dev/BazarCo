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
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-[var(--brand-border)] mt-4">
      <p className="text-xs text-[var(--brand-muted)]">
        Showing <span className="font-medium text-[var(--foreground)]">{from}</span>–
        <span className="font-medium text-[var(--foreground)]">{to}</span> of{" "}
        <span className="font-medium text-[var(--foreground)]">{total}</span>
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {showSizeSelector && (
          <label className="flex items-center gap-2 text-xs text-[var(--brand-muted)]">
            <span className="shrink-0">Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-lg border border-[var(--brand-border)] bg-[var(--input-bg)] px-2.5 py-1.5 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/40"
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--brand-border)] bg-[var(--card-bg)] text-[var(--foreground)] hover:bg-[var(--input-bg)] disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="min-w-[5.5rem] px-1 text-center text-xs tabular-nums text-[var(--brand-muted)]">
            Page {safePage} / {totalPages}
          </span>
          <button
            type="button"
            aria-label="Next page"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--brand-border)] bg-[var(--card-bg)] text-[var(--foreground)] hover:bg-[var(--input-bg)] disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

