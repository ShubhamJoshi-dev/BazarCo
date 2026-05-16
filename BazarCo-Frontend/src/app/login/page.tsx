"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { authLogin } from "@/lib/api";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { RedirectIfAuthed } from "@/components/auth/RedirectIfAuthed";
import { getReturnUrlFromSearch } from "@/lib/loginRedirect";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = getReturnUrlFromSearch(searchParams.toString()) ?? "/dashboard";
  const { setUser } = useAuth();
  const t = useTranslations("auth");
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
      router.push(returnUrl);
      router.refresh();
      return;
    }
    setError(result.message);
  }

  return (
    <RedirectIfAuthed redirectTo={returnUrl}>
      <AuthLayout title={t("signInTitle")} subtitle={t("signInSubtitle")}>
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
              {t("email")}
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
              {t("password")}
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
              className="text-sm font-medium text-[var(--brand-blue)] hover:underline"
            >
              {t("forgotPassword")}
            </Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="clay-btn-red w-full py-3.5 text-base disabled:opacity-60"
          >
            {loading ? t("signingIn") : t("signIn")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--brand-muted)]">
          {t("dontHaveAccount")}{" "}
          <Link href="/signup" className="text-[var(--brand-blue)] font-semibold hover:underline">
            {t("createOne")}
          </Link>
        </p>
      </AuthLayout>
    </RedirectIfAuthed>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
