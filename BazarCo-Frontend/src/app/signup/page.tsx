"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { authSignup } from "@/lib/api";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function SignupPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!/[a-zA-Z]/.test(password)) {
      setError("Password must contain at least one letter");
      return;
    }
    if (!/\d/.test(password)) {
      setError("Password must contain at least one number");
      return;
    }
    setLoading(true);
    const result = await authSignup(email.trim(), password, name.trim() || undefined);
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
    <AuthLayout title="Create account" subtitle="Join BazarCo with your email">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-[var(--brand-red)]/15 border border-[var(--brand-red)]/40 px-4 py-3 text-sm text-[var(--brand-red)]">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="signup-name" className="block text-sm font-medium text-neutral-300 mb-1.5">
            Name (optional)
          </label>
          <input
            id="signup-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            disabled={loading}
            className="w-full rounded-xl border border-neutral-600 bg-neutral-900/80 px-4 py-3 text-[var(--brand-white)] placeholder:text-neutral-500 focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/30 disabled:opacity-60"
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-neutral-300 mb-1.5">
            Email
          </label>
          <input
            id="signup-email"
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
          <label htmlFor="signup-password" className="block text-sm font-medium text-neutral-300 mb-1.5">
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            disabled={loading}
            className="w-full rounded-xl border border-neutral-600 bg-neutral-900/80 px-4 py-3 text-[var(--brand-white)] placeholder:text-neutral-500 focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/30 disabled:opacity-60"
            placeholder="At least 8 characters"
          />
        </div>
        <motion.button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[var(--brand-red)] py-3 font-semibold text-white hover:bg-[var(--brand-red)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)] focus:ring-offset-2 focus:ring-offset-[var(--brand-black)] disabled:opacity-60 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {loading ? "Creating account..." : "Sign up"}
        </motion.button>
      </form>
      <p className="mt-6 text-center text-sm text-neutral-400">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--brand-blue)] font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
