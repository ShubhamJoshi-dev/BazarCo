"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const cardSpring = { type: "spring" as const, stiffness: 280, damping: 28 };

export function AuthLayout({
  children,
  title,
  subtitle,
  variant = "default",
  showOverlay = false,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  /** Wide card for long-form content (e.g. seller agreement). */
  variant?: "default" | "wide";
  /** Dim background when seller agreement panel is open. */
  showOverlay?: boolean;
}) {
  const isWide = variant === "wide";
  return (
    <div className="clay-hero-bg relative flex min-h-screen flex-col overflow-hidden">
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none fixed inset-0 z-[55] bg-[var(--foreground)]/10"
            aria-hidden
          />
        )}
      </AnimatePresence>
      <div
        className="pointer-events-none absolute -right-[8%] -top-[10%] h-80 w-80 rounded-full blur-3xl"
        style={{ background: "rgba(21, 101, 192, 0.06)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-[8%] -left-[6%] h-72 w-72 rounded-full blur-3xl"
        style={{ background: "rgba(198, 40, 40, 0.05)" }}
      />

      <header
        className={`relative z-10 flex justify-center ${isWide ? "pb-4 pt-6 sm:pt-8" : "pb-6 pt-10"}`}
      >
        <Link href="/" className="rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]">
          <Image
            src="/logo.png"
            alt="BazarCo"
            width={180}
            height={76}
            className="h-auto w-40 sm:w-44"
            priority
          />
        </Link>
      </header>

      <main
        className={`relative z-10 flex flex-1 flex-col items-center px-4 py-6 sm:py-8 ${
          isWide ? "justify-start sm:justify-center" : "justify-center"
        }`}
      >
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.97 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: showOverlay ? 0.96 : 1,
            x: showOverlay ? -12 : 0,
          }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={`clay-card w-full ${
            isWide
              ? "flex min-h-[min(92vh,900px)] max-w-4xl flex-col p-6 sm:p-8 lg:p-10"
              : "max-w-md p-8 sm:p-10"
          }`}
        >
          <div
            className={`rounded-full bg-gradient-to-r from-[var(--brand-red)] to-[var(--brand-blue)] ${
              isWide ? "mb-5 h-1 w-24" : "mx-auto mb-6 h-1 w-16"
            }`}
          />

          <h1
            className={`font-bold text-[var(--foreground)] ${
              isWide ? "mb-2 text-left text-2xl sm:text-3xl" : "mb-1 text-center text-2xl"
            }`}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className={`text-[var(--brand-muted)] ${
                isWide
                  ? "mb-6 max-w-3xl text-left text-sm leading-relaxed sm:text-base"
                  : "mb-8 text-center text-sm"
              }`}
            >
              {subtitle}
            </p>
          )}
          <div className={isWide ? "flex min-h-0 flex-1 flex-col" : undefined}>{children}</div>
        </motion.div>
      </main>

      <footer
        className={`relative z-10 flex flex-col items-center gap-2 ${isWide ? "py-4" : "py-6"}`}
      >
        <div className="clay-card flex items-center gap-2 px-4 py-2.5">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
          </span>
          <p className="text-xs text-[var(--brand-muted)]">Verified and secure marketplace</p>
        </div>
      </footer>
    </div>
  );
}
