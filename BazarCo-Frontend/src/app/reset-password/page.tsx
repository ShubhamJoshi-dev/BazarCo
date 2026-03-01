"use client";

import { useState, useEffect, Suspense } from "react";
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
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!token) {
      setError("Invalid reset link. Request a new one.");
      return;
    }
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
      <div className="rounded-xl border border-[var(--brand-red)]/40 bg-[var(--brand-red)]/10 px-4 py-4 text-sm text-[var(--brand-red)]">
        Invalid or missing reset link. Please request a new password reset from the sign in page.
        <p className="mt-4">
          <Link href="/forgot-password" className="text-[var(--brand-blue)] font-medium hover:underline">
            Request new link
          </Link>
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-4 text-sm text-green-400">
        Password has been reset. Redirecting you to sign in...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-[var(--brand-red)]/15 border border-[var(--brand-red)]/40 px-4 py-3 text-sm text-[var(--brand-red)]">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="reset-password" className="block text-sm font-medium text-neutral-300 mb-1.5">
          New password
        </label>
        <input
          id="reset-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          disabled={loading}
          className="w-full rounded-xl border border-neutral-600 bg-neutral-900/80 px-4 py-3 text-[var(--brand-white)] placeholder:text-neutral-500 focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/30 disabled:opacity-60"
          placeholder="At least 8 characters"
        />
      </div>
      <div>
        <label htmlFor="reset-confirm" className="block text-sm font-medium text-neutral-300 mb-1.5">
          Confirm password
        </label>
        <input
          id="reset-confirm"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          disabled={loading}
          className="w-full rounded-xl border border-neutral-600 bg-neutral-900/80 px-4 py-3 text-[var(--brand-white)] placeholder:text-neutral-500 focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/30 disabled:opacity-60"
          placeholder="Repeat password"
        />
      </div>
      <motion.button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[var(--brand-blue)] py-3 font-semibold text-white hover:bg-[var(--brand-blue)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] focus:ring-offset-2 focus:ring-offset-[var(--brand-black)] disabled:opacity-60 disabled:cursor-not-allowed"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {loading ? "Resetting..." : "Reset password"}
      </motion.button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout title="Reset password" subtitle="Enter your new password below">
      <Suspense fallback={<div className="text-neutral-400 text-sm">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-neutral-400">
        <Link href="/login" className="text-[var(--brand-blue)] font-medium hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
