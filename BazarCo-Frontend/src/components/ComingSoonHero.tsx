"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export function ComingSoonHero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <div className="hero-gradient absolute inset-0 opacity-30" />
      <div className="absolute inset-0 bg-[var(--brand-black)]/40" />

      <motion.div
        className="relative z-10 flex flex-col items-center gap-8 text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
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
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          Coming Soon
        </motion.h1>
      </motion.div>

      <motion.div
        className="absolute bottom-8 left-1/2 h-12 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[var(--brand-blue)] to-transparent"
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
      />
    </section>
  );
}
