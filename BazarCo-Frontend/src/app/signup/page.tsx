"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Store, ArrowRight, ArrowLeft, Check, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { authSignup } from "@/lib/api";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { RedirectIfAuthed } from "@/components/auth/RedirectIfAuthed";
import { SellerAgreementDocument } from "@/components/auth/SellerAgreementDocument";

type Role = "buyer" | "seller";
type Step = "role" | "agreement" | "details";

export default function SignupPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const t = useTranslations("auth");

  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<Role | null>(null);
  const [agreedToSellerTerms, setAgreedToSellerTerms] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const ROLES: { id: Role; icon: typeof ShoppingBag; titleKey: string; descKey: string; color: "red" | "blue" }[] = [
    { id: "buyer", icon: ShoppingBag, titleKey: "buyerTitle", descKey: "buyerDesc", color: "blue" },
    { id: "seller", icon: Store, titleKey: "sellerTitle", descKey: "sellerDesc", color: "red" },
  ];

  function handleRoleContinue() {
    if (!role) return;
    setError("");
    if (role === "seller") {
      setAgreedToSellerTerms(false);
      setStep("agreement");
    } else {
      setStep("details");
    }
  }

  function handleAgreementContinue() {
    if (!agreedToSellerTerms) {
      setError(t("mustAgree"));
      return;
    }
    setError("");
    setStep("details");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Full name is required");
      return;
    }
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
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (role === "seller" && !agreedToSellerTerms) {
      setError(t("mustAgree"));
      return;
    }

    setLoading(true);
    const result = await authSignup(email.trim(), password, name.trim(), role!, {
      acceptedSellerTerms: role === "seller" ? agreedToSellerTerms : undefined,
    });
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
    { label: "letter", ok: /[a-zA-Z]/.test(password) },
    { label: "number", ok: /\d/.test(password) },
    { label: "match", ok: confirmPassword.length > 0 && password === confirmPassword },
  ];

  return (
    <RedirectIfAuthed>
      <AuthLayout title={t("signUpTitle")} subtitle={t("signUpSubtitle")}>
        <AnimatePresence mode="wait">
          {step === "role" && (
            <motion.div
              key="role"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.28 }}
              className="space-y-4"
            >
              <p className="text-sm font-semibold text-[var(--brand-muted)] text-center mb-5">
                {t("howWillYouUse")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map(({ id, icon: Icon, titleKey, descKey, color }) => {
                  const selected = role === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setRole(id)}
                      className={`relative flex flex-col items-center gap-3 p-5 rounded-3xl text-left transition-all border-2 ${
                        selected
                          ? color === "blue"
                            ? "border-[var(--brand-blue)] bg-[var(--brand-blue)]/10"
                            : "border-[var(--brand-red)] bg-[var(--brand-red)]/10"
                          : "border-[var(--brand-border)] bg-[var(--card-bg)] hover:border-[var(--brand-muted)]/40"
                      }`}
                    >
                      {selected && (
                        <span
                          className={`absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full ${
                            color === "blue" ? "bg-[var(--brand-blue)]" : "bg-[var(--brand-red)]"
                          }`}
                        >
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </span>
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
                          {t(titleKey)}
                        </p>
                        <p className="text-[11px] text-[var(--brand-muted)] leading-snug mt-0.5">{t(descKey)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                disabled={!role}
                onClick={handleRoleContinue}
                className={`${role === "seller" ? "clay-btn-red" : "clay-btn-blue"} w-full py-3.5 text-base flex items-center justify-center gap-2 mt-2 disabled:opacity-40`}
              >
                {t("continue")} <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-center text-sm text-[var(--brand-muted)] pt-1">
                {t("alreadyHaveAccount")}{" "}
                <Link href="/login" className="text-[var(--brand-blue)] font-semibold hover:underline">
                  {t("signIn")}
                </Link>
              </p>
            </motion.div>
          )}

          {step === "agreement" && (
            <motion.div
              key="agreement"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.28 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 clay-badge-red" style={{ display: "inline-flex", borderRadius: 999, padding: "6px 12px" }}>
                <FileText className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">{t("sellerAgreementTitle")}</span>
              </div>
              <p className="text-xs text-[var(--brand-muted)]">{t("sellerAgreementSubtitle")}</p>

              {error && (
                <div className="rounded-2xl bg-[var(--brand-red)]/12 border border-[var(--brand-red)]/35 px-4 py-3 text-sm text-[var(--brand-red)]">
                  {error}
                </div>
              )}

              <div className="max-h-[min(52vh,420px)] overflow-y-auto rounded-2xl border border-[var(--brand-border)] bg-neutral-50 p-4 text-left text-xs scrollbar-hide">
                <SellerAgreementDocument />
              </div>

              <label className="flex items-start gap-3 cursor-pointer text-left">
                <input
                  type="checkbox"
                  checked={agreedToSellerTerms}
                  onChange={(e) => {
                    setAgreedToSellerTerms(e.target.checked);
                    if (e.target.checked) setError("");
                  }}
                  className="mt-1 h-4 w-4 rounded border-neutral-300 text-[var(--brand-red)] focus:ring-[var(--brand-red)]"
                />
                <span className="text-xs leading-relaxed text-[var(--foreground)]">{t("agreeLabel")}</span>
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setStep("role");
                  }}
                  className="flex-1 rounded-2xl border border-[var(--brand-border)] py-3 text-sm font-semibold hover:bg-neutral-50"
                >
                  {t("back")}
                </button>
                <button
                  type="button"
                  disabled={!agreedToSellerTerms}
                  onClick={handleAgreementContinue}
                  className="clay-btn-red flex-[2] py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {t("continue")} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.28 }}
            >
              <div
                className={`flex items-center gap-2 mb-5 ${role === "seller" ? "clay-badge-red" : "clay-badge-blue"}`}
                style={{ display: "inline-flex", borderRadius: 999, padding: "6px 12px" }}
              >
                {role === "seller" ? <Store className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                <span className="text-xs font-bold capitalize">{role} account</span>
                <button
                  type="button"
                  onClick={() => setStep(role === "seller" ? "agreement" : "role")}
                  className="ml-1 opacity-60 hover:opacity-100"
                  aria-label={t("back")}
                >
                  <ArrowLeft className="w-3 h-3" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-2xl bg-[var(--brand-red)]/12 border border-[var(--brand-red)]/35 px-4 py-3 text-sm text-[var(--brand-red)]">
                    {error}
                  </div>
                )}
                <div>
                  <label htmlFor="signup-name" className="block text-sm font-semibold mb-2">
                    {t("fullName")}
                  </label>
                  <input
                    id="signup-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    autoFocus
                    disabled={loading}
                    className="clay-input w-full px-4 py-3 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label htmlFor="signup-email" className="block text-sm font-semibold mb-2">
                    {t("email")}
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={loading}
                    className="clay-input w-full px-4 py-3 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label htmlFor="signup-password" className="block text-sm font-semibold mb-2">
                    {t("password")}
                  </label>
                  <input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={loading}
                    className="clay-input w-full px-4 py-3 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label htmlFor="signup-confirm" className="block text-sm font-semibold mb-2">
                    {t("confirmPassword")}
                  </label>
                  <input
                    id="signup-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={loading}
                    className="clay-input w-full px-4 py-3 disabled:opacity-60"
                  />
                </div>
                {password.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {pwdChecks.map(({ label, ok }) => (
                      <span
                        key={label}
                        className={`text-[11px] px-2.5 py-1 rounded-full font-semibold border ${
                          ok
                            ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-600"
                            : "bg-neutral-100 border-neutral-200 text-[var(--brand-muted)]"
                        }`}
                      >
                        {ok ? "✓ " : ""}
                        {label}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className={`${role === "seller" ? "clay-btn-red" : "clay-btn-blue"} w-full py-3.5 text-base disabled:opacity-60`}
                >
                  {loading ? t("creatingAccount") : t("createAccount")}
                </button>
              </form>
              <p className="mt-5 text-center text-sm text-[var(--brand-muted)]">
                {t("alreadyHaveAccount")}{" "}
                <Link href="/login" className="text-[var(--brand-blue)] font-semibold hover:underline">
                  {t("signIn")}
                </Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </AuthLayout>
    </RedirectIfAuthed>
  );
}
