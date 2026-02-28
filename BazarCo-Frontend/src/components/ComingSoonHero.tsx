"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export function ComingSoonHero() {
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
        <motion.h1
          className="text-3xl font-bold tracking-tight text-[var(--brand-white)] sm:text-4xl md:text-5xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
        >
          Coming Soon
        </motion.h1>
      </motion.div>

      <motion.div
        className="absolute bottom-8 left-1/2 h-10 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[var(--brand-blue)]/60 to-transparent"
        animate={{ opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
    </section>
  );
}
