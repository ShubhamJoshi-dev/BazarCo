"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Store, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authSignup } from "@/lib/api";
import { AuthLayout } from "@/components/auth/AuthLayout";

type Role = "buyer" | "seller";
type Step = "role" | "details";

const ROLES: { id: Role; icon: typeof ShoppingBag; title: string; desc: string; color: "red" | "blue" }[] = [
  {
    id: "buyer",
    icon: ShoppingBag,
    title: "I'm a Buyer",
    desc: "Browse products, place orders, and discover deals",
    color: "blue",
  },
  {
    id: "seller",
    icon: Store,
    title: "I'm a Seller",
    desc: "List products, manage orders, and grow your business",
    color: "red",
  },
];

export default function SignupPage() {
  const router = useRouter();
  const { setUser } = useAuth();

  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleRoleSelect(r: Role) {
    setRole(r);
  }

  function handleRoleContinue() {
    if (!role) return;
    setError("");
    setStep("details");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Full name is required"); return; }
    if (!email.trim()) { setError("Email is required"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (!/[a-zA-Z]/.test(password)) { setError("Password must contain at least one letter"); return; }
    if (!/\d/.test(password)) { setError("Password must contain at least one number"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }

    setLoading(true);
    const result = await authSignup(email.trim(), password, name.trim(), role!);
    setLoading(false);

    if (result.status === "success" && result.user) {
      setUser(result.user);
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setError(result.message);
  }

  const pwdChecks = [
    { label: "8+ chars", ok: password.length >= 8 },
    { label: "letter",   ok: /[a-zA-Z]/.test(password) },
    { label: "number",   ok: /\d/.test(password) },
    { label: "match",    ok: confirmPassword.length > 0 && password === confirmPassword },
  ];

  return (
    <AuthLayout title="Create your account" subtitle="Join BazarCo — it's free">
      <AnimatePresence mode="wait">

        {/* ── Step 1: Role picker ── */}
        {step === "role" && (
          <motion.div
            key="role"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            <p className="text-sm font-semibold text-[var(--brand-muted)] text-center mb-5">
              How will you use BazarCo?
            </p>

            <div className="grid grid-cols-2 gap-3">
              {ROLES.map(({ id, icon: Icon, title, desc, color }) => {
                const selected = role === id;
                return (
                  <motion.button
                    key={id}
                    type="button"
                    onClick={() => handleRoleSelect(id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className={`relative flex flex-col items-center gap-3 p-5 rounded-3xl text-left transition-all border-2 ${
                      selected
                        ? color === "blue"
                          ? "border-[var(--brand-blue)] bg-[var(--brand-blue)]/10"
                          : "border-[var(--brand-red)] bg-[var(--brand-red)]/10"
                        : "border-[var(--brand-border)] bg-[var(--card-bg)] hover:border-[var(--brand-muted)]/40"
                    }`}
                    style={{
                      boxShadow: selected
                        ? color === "blue"
                          ? "var(--clay-shadow-blue)"
                          : "var(--clay-shadow-red)"
                        : "var(--clay-shadow-neutral)",
                    }}
                  >
                    {/* Selected tick */}
                    {selected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full ${
                          color === "blue" ? "bg-[var(--brand-blue)]" : "bg-[var(--brand-red)]"
                        }`}
                      >
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </motion.span>
                    )}
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                        selected
                          ? color === "blue"
                            ? "bg-[var(--brand-blue)]/20 text-[var(--brand-blue)]"
                            : "bg-[var(--brand-red)]/20 text-[var(--brand-red)]"
                          : "bg-[var(--brand-muted)]/15 text-[var(--brand-muted)]"
                      }`}
                    >
                      <Icon className="w-6 h-6" strokeWidth={1.8} />
                    </span>
                    <div>
                      <p className={`font-bold text-sm ${selected ? "text-[var(--foreground)]" : "text-[var(--brand-muted)]"}`}>
                        {title}
                      </p>
                      <p className="text-[11px] text-[var(--brand-muted)] leading-snug mt-0.5">{desc}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <motion.button
              type="button"
              disabled={!role}
              onClick={handleRoleContinue}
              whileHover={{ scale: role ? 1.01 : 1 }}
              whileTap={{ scale: role ? 0.98 : 1 }}
              className={`clay-btn-${role === "seller" ? "red" : "blue"} w-full py-3.5 text-base flex items-center justify-center gap-2 mt-2 disabled:opacity-40`}
            >
              Continue <ArrowRight className="w-4 h-4" />
            </motion.button>

            <p className="text-center text-sm text-[var(--brand-muted)] pt-1">
              Already have an account?{" "}
              <Link href="/login" className="text-[var(--brand-blue)] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </motion.div>
        )}

        {/* ── Step 2: Details form ── */}
        {step === "details" && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Role summary */}
            <div className={`flex items-center gap-2 mb-5 ${role === "seller" ? "clay-badge-red" : "clay-badge-blue"}`}
              style={{ display: "inline-flex", borderRadius: 999, padding: "6px 12px" }}
            >
              {role === "seller" ? (
                <Store className="w-3.5 h-3.5" />
              ) : (
                <ShoppingBag className="w-3.5 h-3.5" />
              )}
              <span className="text-xs font-bold capitalize">{role} account</span>
              <button
                type="button"
                onClick={() => setStep("role")}
                className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
              >
                <ArrowLeft className="w-3 h-3" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label htmlFor="signup-name" className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                  Full name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  autoFocus
                  disabled={loading}
                  className="clay-input w-full px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--brand-muted)] disabled:opacity-60"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                  Email
                </label>
                <input
                  id="signup-email"
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
                <label htmlFor="signup-password" className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                  Password
                </label>
                <input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                  className="clay-input w-full px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--brand-muted)] disabled:opacity-60"
                  placeholder="Min 8 chars, 1 letter, 1 number"
                />
              </div>

              <div>
                <label htmlFor="signup-confirm" className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                  Confirm password
                </label>
                <input
                  id="signup-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                  className="clay-input w-full px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--brand-muted)] disabled:opacity-60"
                  placeholder="Repeat password"
                />
              </div>

              {password.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {pwdChecks.map(({ label, ok }) => (
                    <span
                      key={label}
                      className={`text-[11px] px-2.5 py-1 rounded-full font-semibold border transition-all ${
                        ok
                          ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-400"
                          : "bg-[var(--brand-muted)]/8 border-[var(--brand-muted)]/15 text-[var(--brand-muted)]"
                      }`}
                    >
                      {ok ? "✓ " : ""}{label}
                    </span>
                  ))}
                </div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                className={`${role === "seller" ? "clay-btn-red" : "clay-btn-blue"} w-full py-3.5 text-base`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? "Creating account…" : "Create account"}
              </motion.button>
            </form>

            <p className="mt-5 text-center text-sm text-[var(--brand-muted)]">
              Already have an account?{" "}
              <Link href="/login" className="text-[var(--brand-blue)] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}
