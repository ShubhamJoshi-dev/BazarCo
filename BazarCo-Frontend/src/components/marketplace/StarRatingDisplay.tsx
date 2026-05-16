"use client";

import { Star } from "lucide-react";

export function StarRatingDisplay({
  rating,
  size = "sm",
  showValue,
  reviewCount,
}: {
  rating: number;
  size?: "sm" | "md";
  showValue?: boolean;
  reviewCount?: number;
}) {
  const starClass = size === "md" ? "w-3.5 h-3.5" : "w-3 h-3";
  const filled = (s: number) => s <= Math.round(rating);
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <div className="flex items-center gap-px" role="img" aria-label={`${rating.toFixed(1)} out of 5`}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`${starClass} shrink-0 ${filled(s) ? "text-amber-400 fill-amber-400" : "text-neutral-300 fill-transparent"}`}
            strokeWidth={filled(s) ? 0 : 1.5}
          />
        ))}
      </div>
      {showValue && <span className="text-xs font-semibold text-[var(--foreground)]">{rating.toFixed(1)}</span>}
      {typeof reviewCount === "number" && (
        <span className="text-xs text-[var(--brand-muted)]">({reviewCount.toLocaleString()})</span>
      )}
    </div>
  );
}
