"use client";

type SellerMenuButtonProps = {
  open: boolean;
  onClick: () => void;
  label: string;
  className?: string;
};

/** Animated hamburger ↔ close icon for sidebar toggle */
export function SellerMenuButton({ open, onClick, label, className = "" }: SellerMenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={open}
      className={`seller-menu-btn group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--brand-border)] bg-[var(--card-bg)] text-[var(--foreground)] shadow-sm transition-all hover:border-[var(--brand-red)]/25 hover:bg-[var(--row-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/30 ${className}`}
    >
      <span className="relative flex h-4 w-[18px] flex-col justify-between">
        <span
          className={`block h-[2px] w-full rounded-full bg-current transition-all duration-300 ease-out origin-center ${
            open ? "translate-y-[7px] rotate-45" : ""
          }`}
        />
        <span
          className={`block h-[2px] w-full rounded-full bg-current transition-all duration-300 ease-out ${
            open ? "scale-x-0 opacity-0" : ""
          }`}
        />
        <span
          className={`block h-[2px] w-full rounded-full bg-current transition-all duration-300 ease-out origin-center ${
            open ? "-translate-y-[7px] -rotate-45" : ""
          }`}
        />
      </span>
    </button>
  );
}
