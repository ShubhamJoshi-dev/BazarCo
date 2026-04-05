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
    <div className="clay-hero-bg min-h-screen flex flex-col relative overflow-hidden">
      {/* Floating clay blobs */}
      <div className="absolute top-[-10%] right-[-8%] w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{ background: "var(--dashboard-glow-blue)" }} />
      <div className="absolute bottom-[-8%] left-[-6%] w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ background: "var(--dashboard-glow-red)" }} />
      <div className="absolute top-[40%] left-[30%] w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-50"
        style={{ background: "var(--dashboard-glow-blue)" }} />

      <header className="relative z-10 flex justify-center pt-10 pb-6">
        <Link href="/" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] rounded-2xl">
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

          <h1 className="text-2xl font-bold text-[var(--brand-white)] text-center mb-1">
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
        <div className="clay-card px-4 py-2.5 flex items-center gap-2">
          <span className="inline-flex w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/50 items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </span>
          <p className="text-xs text-[var(--brand-muted)]">Verified and secure marketplace</p>
        </div>
      </footer>
    </div>
  );
}
