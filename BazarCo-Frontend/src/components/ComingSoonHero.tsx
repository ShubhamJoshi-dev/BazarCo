"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

export function ComingSoonHero() {
  const { user } = useAuth();

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <div className="hero-gradient absolute inset-0 opacity-25" />
      <div className="absolute inset-0 bg-[var(--brand-black)]/30" />

      <motion.div
        className="hero-card relative z-10 flex flex-col items-center gap-8 rounded-2xl px-8 py-12 text-center sm:px-12 sm:py-14 border-0 outline-none shadow-none"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
          className="relative"
        >
          <Image
            src="/logo.png"
            alt="BazarCo"
            width={280}
            height={120}
            priority
            className="h-auto w-64 sm:w-72 md:w-80"
          />
        </motion.div>

        {/* Loading animation - gradient bar + dots */}
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease: "easeOut" }}
        >
          <div className="relative h-1 w-24 overflow-hidden rounded-full bg-neutral-800/80 sm:w-28">
            <div className="loading-shimmer-bar absolute inset-0 rounded-full opacity-90" />
          </div>
          <div className="flex items-center justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2"
                style={{
                  backgroundColor: i === 1 ? "var(--brand-blue)" : "var(--brand-red)",
                }}
                animate={{
                  scale: [0.9, 1.2, 0.9],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </motion.div>

        <motion.h1
          className="text-3xl font-bold tracking-tight text-[var(--brand-white)] sm:text-4xl md:text-5xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
        >
          Coming Soon
        </motion.h1>
        <motion.p
          className="text-base font-medium tracking-wide text-neutral-400 sm:text-lg"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.5, ease: "easeOut" }}
        >
          Product launches{" "}
          <span className="font-semibold text-[var(--brand-blue)]">August 20, 2026</span>
        </motion.p>

        {user && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-red)]/20 border border-[var(--brand-red)]/50 px-5 py-2.5 text-sm font-medium text-[var(--brand-red)] hover:bg-[var(--brand-red)]/30"
            >
              Go to Dashboard
            </Link>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        className="absolute bottom-8 left-1/2 h-10 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[var(--brand-blue)]/60 to-transparent"
        animate={{ opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
    </section>
  );
}
