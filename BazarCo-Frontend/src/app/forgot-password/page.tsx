"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { authForgotPassword } from "@/lib/api";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    setLoading(true);
    const result = await authForgotPassword(email.trim());
    setLoading(false);
    if (result.status === "success") {
      setSuccess(true);
      return;
    }
    setError(result.message);
  }

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Enter your email and we'll send you a reset link"
    >
      {success ? (
        <div className="rounded-xl border border-[var(--brand-blue)]/40 bg-[var(--brand-blue)]/10 px-4 py-4 text-sm text-[var(--brand-blue)]">
          If an account exists for that email, you will receive a password reset link shortly.
          Check your inbox and spam folder.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-[var(--brand-red)]/15 border border-[var(--brand-red)]/40 px-4 py-3 text-sm text-[var(--brand-red)]">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="forgot-email" className="block text-sm font-medium text-neutral-300 mb-1.5">
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
              className="w-full rounded-xl border border-neutral-600 bg-neutral-900/80 px-4 py-3 text-[var(--brand-white)] placeholder:text-neutral-500 focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/30 disabled:opacity-60"
              placeholder="you@example.com"
            />
          </div>
          <motion.button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[var(--brand-blue)] py-3 font-semibold text-white hover:bg-[var(--brand-blue)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] focus:ring-offset-2 focus:ring-offset-[var(--brand-black)] disabled:opacity-60 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {loading ? "Sending..." : "Send reset link"}
          </motion.button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-neutral-400">
        <Link href="/login" className="text-[var(--brand-blue)] font-medium hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
