"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export function WelcomeHero() {
  return (
    <section className="clay-hero-bg relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      <motion.div
        className="absolute top-[30%] left-[4%] w-56 h-56 rounded-full blur-3xl pointer-events-none"
        style={{ background: "var(--dashboard-glow-blue)", opacity: 0.9 }}
        animate={{ y: [0, -22, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[22%] right-[4%] w-64 h-64 rounded-full blur-3xl pointer-events-none"
        style={{ background: "var(--dashboard-glow-red)", opacity: 0.9 }}
        animate={{ y: [0, 22, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <motion.div
        className="relative z-10 clay-card flex flex-col items-center gap-8 px-8 py-12 sm:px-12 sm:py-14 text-center max-w-xl w-full"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="absolute top-0 inset-x-0 h-1 rounded-t-[24px] overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-[var(--brand-red)] via-[#7b3fd1] to-[var(--brand-blue)]" />
        </div>

        <Image
          src="/logo.png"
          alt="BazarCo"
          width={260}
          height={110}
          priority
          className="h-auto w-48 sm:w-56"
        />

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--foreground)]">
            Nepal&apos;s marketplace for{" "}
            <span className="bg-gradient-to-r from-[var(--brand-red)] to-[var(--brand-blue)] bg-clip-text text-transparent">
              buyers & sellers
            </span>
          </h1>
          <p className="text-sm text-[var(--brand-muted)] max-w-md mx-auto leading-relaxed">
            Shop local products, negotiate bargains, track orders, and sell with video — all in one place.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap justify-center w-full">
          <Link
            href="/dashboard/browse"
            className="clay-btn-blue px-8 py-3.5 text-sm flex-1 sm:flex-none flex items-center justify-center min-w-[160px]"
          >
            Browse products
          </Link>
          <Link
            href="/signup"
            className="clay-btn-red px-8 py-3.5 text-sm flex-1 sm:flex-none flex items-center justify-center min-w-[140px]"
          >
            Create account
          </Link>
          <Link
            href="/login"
            className="rounded-2xl border border-[var(--brand-border)] px-6 py-3.5 text-sm font-semibold flex-1 sm:flex-none flex items-center justify-center min-w-[120px] hover:bg-neutral-50"
          >
            Sign in
          </Link>
        </div>

        <div className="flex items-center gap-4 flex-wrap justify-center pt-2">
          {[
            { dot: "#22c55e", text: "KYC verified sellers" },
            { dot: "#1565c0", text: "Secure checkout" },
            { dot: "#c62828", text: "Live chat & bargains" },
          ].map(({ dot, text }) => (
            <div key={text} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
              <span className="text-xs text-[var(--brand-muted)] font-medium">{text}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="absolute bottom-0 inset-x-0 flex h-1.5 z-20">
        {["#1540a8", "#f5f0e8", "#c0201c", "#1d7a35", "#d98a00"].map((c, i) => (
          <div key={i} className="flex-1" style={{ background: c }} />
        ))}
      </div>
    </section>
  );
}
