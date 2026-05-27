"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Shield, User } from "lucide-react";
import { adminLogin } from "@/lib/adminApi";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useToast } from "@/contexts/ToastContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { setAdmin } = useAdminAuth();
  const toast = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await adminLogin(username.trim(), password);
    setLoading(false);
    if (result.status === "success") {
      setAdmin(result.admin);
      toast.success("Welcome to Enterprise Admin");
      router.push("/admin");
      router.refresh();
      return;
    }
    setError(result.message || "Invalid username or password");
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 lg:flex lg:flex-col lg:justify-between">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(21,101,192,0.35) 0%, transparent 45%), radial-gradient(circle at 80% 80%, rgba(198,40,40,0.25) 0%, transparent 40%)",
            }}
          />
          <div className="relative z-10 p-10 xl:p-14">
            <Link href="/" className="inline-block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50">
              <Image
                src="/logo.png"
                alt="BazarCo"
                width={280}
                height={96}
                className="h-[4.5rem] w-auto max-w-[16rem] object-contain brightness-0 invert xl:h-20 xl:max-w-[18rem]"
                priority
              />
            </Link>
          </div>
          <div className="relative z-10 px-10 pb-14 xl:px-14 xl:pb-16">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/90 backdrop-blur-sm">
              <Shield className="h-3.5 w-3.5 text-sky-300" />
              Enterprise Admin
            </div>
            <h1 className="max-w-md text-3xl font-bold leading-tight text-white xl:text-4xl">
              Secure control centre for your marketplace
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-300">
              Manage users, KYC, products, chat moderation, and system tools. All actions are audit-logged.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-red)]" />
                Role-based access control
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                Encrypted admin sessions
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Full audit trail
              </li>
            </ul>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-16 xl:px-20">
          <div className="mx-auto w-full max-w-[420px]">
            <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-left">
              <div className="mb-6 lg:hidden">
                <Image
                  src="/logo.png"
                  alt="BazarCo"
                  width={240}
                  height={80}
                  className="mx-auto h-[3.75rem] w-auto max-w-[14rem] object-contain sm:h-16 sm:max-w-[15rem]"
                  priority
                />
              </div>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-blue)]/10 text-[var(--brand-blue)] ring-1 ring-[var(--brand-blue)]/20">
                <Lock className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--foreground)]">Admin sign in</h2>
              <p className="mt-2 text-sm text-[var(--brand-muted)]">
                Use your assigned username and password
              </p>
            </div>

            <motion.form
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {error && (
                <div className="rounded-xl border border-[var(--brand-red)]/35 bg-[var(--brand-red)]/10 px-4 py-3 text-sm text-[var(--brand-red)]">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="admin-username" className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                  Username
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--brand-muted)]" />
                  <input
                    id="admin-username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    placeholder="e.g. shubham"
                    className="clay-input w-full py-3 pl-11 pr-4 disabled:opacity-60"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="admin-password" className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--brand-muted)]" />
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    placeholder="••••••••"
                    className="clay-input w-full py-3 pl-11 pr-12 disabled:opacity-60"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[var(--brand-muted)] hover:bg-[var(--input-bg)] hover:text-[var(--foreground)]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="clay-btn-red w-full py-3.5 text-sm font-semibold disabled:opacity-60"
              >
                {loading ? "Signing in…" : "Sign in to admin panel"}
              </button>
            </motion.form>

            <p className="mt-8 text-center text-xs text-[var(--brand-muted)] lg:text-left">
              Not an admin?{" "}
              <Link href="/login" className="font-semibold text-[var(--brand-blue)] hover:underline">
                Back to marketplace login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
