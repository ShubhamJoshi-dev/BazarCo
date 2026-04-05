"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { authResetPassword } from "@/lib/api";
import { AuthLayout } from "@/components/auth/AuthLayout";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasToken = token.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (!token) { setError("Invalid reset link. Request a new one."); return; }
    setLoading(true);
    const result = await authResetPassword(token, password);
    setLoading(false);
    if (result.status === "success") {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
      return;
    }
    setError(result.message);
  }

  if (!hasToken) {
    return (
      <div className="clay-card-red rounded-2xl px-4 py-4 text-sm text-[var(--brand-red)]">
        Invalid or missing reset link. Please request a new password reset.
        <p className="mt-4">
          <Link href="/forgot-password" className="text-[var(--brand-blue)] font-semibold hover:underline">
            Request new link
          </Link>
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="clay-card rounded-2xl border-emerald-500/25 px-4 py-4 text-sm text-emerald-400" style={{ boxShadow: "0 8px 24px rgba(16,185,129,0.18)" }}>
        Password has been reset. Redirecting you to sign in…
      </div>
    );
  }

  return (
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
        <label htmlFor="reset-password" className="block text-sm font-semibold text-[var(--foreground)] mb-2">
          New password
        </label>
        <input
          id="reset-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          disabled={loading}
          className="clay-input w-full px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--brand-muted)] disabled:opacity-60"
          placeholder="At least 8 characters"
        />
      </div>
      <div>
        <label htmlFor="reset-confirm" className="block text-sm font-semibold text-[var(--foreground)] mb-2">
          Confirm password
        </label>
        <input
          id="reset-confirm"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          disabled={loading}
          className="clay-input w-full px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--brand-muted)] disabled:opacity-60"
          placeholder="Repeat password"
        />
      </div>
      <motion.button
        type="submit"
        disabled={loading}
        className="clay-btn-blue w-full py-3.5 text-base"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        {loading ? "Resetting…" : "Reset password"}
      </motion.button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout title="Reset password" subtitle="Enter your new password below">
      <Suspense fallback={<div className="text-[var(--brand-muted)] text-sm">Loading…</div>}>
        <ResetPasswordForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-[var(--brand-muted)]">
        <Link href="/login" className="text-[var(--brand-blue)] font-semibold hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
