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
    if (!email.trim()) { setError("Email is required"); return; }
    setLoading(true);
    const result = await authForgotPassword(email.trim());
    setLoading(false);
    if (result.status === "success") { setSuccess(true); return; }
    setError(result.message);
  }

  return (
    <AuthLayout title="Forgot password" subtitle="Enter your email and we'll send you a reset link">
      {success ? (
        <div className="clay-card-blue rounded-2xl px-4 py-4 text-sm text-[var(--brand-blue)]">
          If an account exists for that email, you will receive a password reset link shortly.
          Check your inbox and spam folder.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-[var(--brand-red)]/12 border border-[var(--brand-red)]/35 px-4 py-3 text-sm text-[var(--brand-red)]"
            >
              {error}
            </motion.div>
          )}
          <div>
            <label htmlFor="forgot-email" className="block text-sm font-semibold text-[var(--foreground)] mb-2">
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
              className="clay-input w-full px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--brand-muted)] disabled:opacity-60"
              placeholder="you@example.com"
            />
          </div>
          <motion.button
            type="submit"
            disabled={loading}
            className="clay-btn-blue w-full py-3.5 text-base"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? "Sending…" : "Send reset link"}
          </motion.button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-[var(--brand-muted)]">
        <Link href="/login" className="text-[var(--brand-blue)] font-semibold hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
