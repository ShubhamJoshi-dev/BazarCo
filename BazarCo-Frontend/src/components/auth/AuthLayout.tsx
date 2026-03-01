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
    <div className="min-h-screen bg-[var(--brand-black)] flex flex-col">
      <div className="hero-gradient absolute inset-0 opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-[var(--brand-black)]/40 pointer-events-none" />

      <header className="relative z-10 flex justify-center pt-10 pb-6">
        <Link href="/" className="focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] rounded-lg">
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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <h1 className="text-2xl font-bold text-[var(--brand-white)] text-center mb-1">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-neutral-400 text-center mb-8">
              {subtitle}
            </p>
          )}
          {children}
        </motion.div>
      </main>

      <footer className="relative z-10 py-6 flex flex-col items-center gap-2">
        <p className="text-xs text-neutral-500 flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          </span>
          Verified and secure marketplace
        </p>
      </footer>
    </div>
  );
}
