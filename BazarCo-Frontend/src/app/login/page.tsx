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
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }
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
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-[var(--brand-red)]/15 border border-[var(--brand-red)]/40 px-4 py-3 text-sm text-[var(--brand-red)]">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-neutral-300 mb-1.5">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={loading}
            className="w-full rounded-xl border border-neutral-600 bg-neutral-900/80 px-4 py-3 text-[var(--brand-white)] placeholder:text-neutral-500 focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/30 disabled:opacity-60"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-neutral-300 mb-1.5">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={loading}
            className="w-full rounded-xl border border-neutral-600 bg-neutral-900/80 px-4 py-3 text-[var(--brand-white)] placeholder:text-neutral-500 focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/30 disabled:opacity-60"
            placeholder="••••••••"
          />
        </div>
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-[var(--brand-blue)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] rounded"
          >
            Forgot password?
          </Link>
        </div>
        <motion.button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[var(--brand-red)] py-3 font-semibold text-white hover:bg-[var(--brand-red)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)] focus:ring-offset-2 focus:ring-offset-[var(--brand-black)] disabled:opacity-60 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {loading ? "Signing in..." : "Sign in"}
        </motion.button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-400">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-[var(--brand-blue)] font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
