"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="clay-hero-bg relative flex min-h-screen flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute -right-[8%] -top-[10%] h-80 w-80 rounded-full blur-3xl"
        style={{ background: "rgba(21, 101, 192, 0.06)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-[8%] -left-[6%] h-72 w-72 rounded-full blur-3xl"
        style={{ background: "rgba(198, 40, 40, 0.05)" }}
      />

      <header className="relative z-10 flex justify-center pb-6 pt-10">
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

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md clay-card p-8 sm:p-10"
        >
          {/* Top accent bar */}
          <div className="h-1 w-16 rounded-full mx-auto mb-6 bg-gradient-to-r from-[var(--brand-red)] to-[var(--brand-blue)]" />

          <h1 className="mb-1 text-center text-2xl font-bold text-[var(--foreground)]">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-[var(--brand-muted)] text-center mb-8">
              {subtitle}
            </p>
          )}
          {children}
        </motion.div>
      </main>

      <footer className="relative z-10 py-6 flex flex-col items-center gap-2">
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
