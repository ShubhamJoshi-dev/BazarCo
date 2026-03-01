"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";

type ThemeOption = "light" | "dark" | "system";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useTranslations("theme");

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current: ThemeOption = (theme as ThemeOption) || "system";
  const Icon = current === "light" ? Sun : current === "dark" ? Moon : Monitor;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center rounded-lg border border-[var(--brand-border)] bg-[var(--card-bg)] p-2 text-[var(--brand-white)] hover:bg-white/5 transition-colors"
        aria-label="Change theme"
      >
        <Icon className="w-4 h-4" />
      </button>
      {open && (
        <ul
          className="absolute right-0 top-full mt-1 min-w-[120px] rounded-lg border border-[var(--brand-border)] bg-[var(--card-bg)] py-1 shadow-lg z-50"
          role="listbox"
        >
          {(["light", "dark", "system"] as const).map((opt) => (
            <li key={opt} role="option">
              <button
                type="button"
                onClick={() => {
                  setTheme(opt);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  theme === opt
                    ? "bg-[var(--brand-blue)]/20 text-[var(--brand-blue)]"
                    : "text-[var(--brand-white)] hover:bg-white/5"
                }`}
              >
                {opt === "light" && <Sun className="w-4 h-4" />}
                {opt === "dark" && <Moon className="w-4 h-4" />}
                {opt === "system" && <Monitor className="w-4 h-4" />}
                {opt === "light" && t("light")}
                {opt === "dark" && t("dark")}
                {opt === "system" && t("system")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
