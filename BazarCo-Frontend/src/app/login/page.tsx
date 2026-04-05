"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { authLogin } from "@/lib/api";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Email is required"); return; }
    if (!password) { setError("Password is required"); return; }
    setLoading(true);
    const result = await authLogin(email.trim(), password);
    setLoading(false);
    if (result.status === "success" && result.user) {
      setUser(result.user);
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setError(result.message);
  }

  return (
    <AuthLayout title="Sign in as a Dev" subtitle="Enter your credentials to continue">
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
          <label htmlFor="login-email" className="block text-sm font-semibold text-[var(--foreground)] mb-2">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={loading}
            className="clay-input w-full px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--brand-muted)] disabled:opacity-60"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="block text-sm font-semibold text-[var(--foreground)] mb-2">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={loading}
            className="clay-input w-full px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--brand-muted)] disabled:opacity-60"
            placeholder="••••••••"
          />
        </div>
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-[var(--brand-blue)] hover:underline focus:outline-none rounded"
          >
            Forgot password?
          </Link>
        </div>
        <motion.button
          type="submit"
          disabled={loading}
          className="clay-btn-red w-full py-3.5 text-base"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </motion.button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--brand-muted)]">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-[var(--brand-blue)] font-semibold hover:underline">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
