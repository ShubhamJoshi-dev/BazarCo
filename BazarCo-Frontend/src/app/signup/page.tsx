"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Store, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { authSignup } from "@/lib/api";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { RedirectIfAuthed } from "@/components/auth/RedirectIfAuthed";
import { SellerSignupSlidePanel } from "@/components/auth/SellerSignupSlidePanel";
import { SignupStepPanel } from "@/components/auth/SignupStepPanel";

type Role = "buyer" | "seller";
type Step = "role" | "details";

export default function SignupPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const t = useTranslations("auth");

  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<Role | null>(null);
  const [sellerPanelOpen, setSellerPanelOpen] = useState(false);
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

  const openSellerPanel = useCallback(() => {
    setRole("seller");
    setError("");
    setSellerPanelOpen(true);
  }, []);

  const closeSellerPanel = useCallback(() => {
    setSellerPanelOpen(false);
    setError("");
  }, []);

  function handleRoleSelect(id: Role) {
    setRole(id);
    setError("");
    if (id === "buyer") {
      closeSellerPanel();
      if (step === "details") setStep("role");
    }
  }

  function handleRoleContinue() {
    if (!role) return;
    setError("");
    if (role === "seller") {
      if (agreedToSellerTerms) {
        setSellerPanelOpen(false);
        setStep("details");
      } else {
        openSellerPanel();
      }
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
    setSellerPanelOpen(false);
    setStep("details");
  }

  function handleDetailsBack() {
    setError("");
    if (role === "seller" && agreedToSellerTerms) {
      setStep("role");
      return;
    }
    setStep("role");
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

  const isSeller = role === "seller";
  const isBuyer = role === "buyer";

  return (
    <RedirectIfAuthed>
      <AuthLayout
        title={t("signUpTitle")}
        subtitle={t("signUpSubtitle")}
        showOverlay={sellerPanelOpen}
      >
        <AnimatePresence mode="wait">
          {step === "role" && (
            <SignupStepPanel stepKey="role" className="space-y-4">
              <p className="mb-5 text-center text-sm font-semibold text-[var(--brand-muted)]">
                {t("howWillYouUse")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map(({ id, icon: Icon, titleKey, descKey, color }) => {
                  const selected = role === id;
                  return (
                    <motion.button
                      key={id}
                      type="button"
                      onClick={() => handleRoleSelect(id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative flex flex-col items-center gap-3 rounded-3xl border-2 p-5 text-left transition-colors ${
                        selected
                          ? color === "blue"
                            ? "border-[var(--brand-blue)] bg-[var(--brand-blue)]/10"
                            : "border-[var(--brand-red)] bg-[var(--brand-red)]/10"
                          : "border-[var(--brand-border)] bg-[var(--card-bg)] hover:border-[var(--brand-muted)]/40"
                      }`}
                    >
                      {selected && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full ${
                            color === "blue" ? "bg-[var(--brand-blue)]" : "bg-[var(--brand-red)]"
                          }`}
                        >
                          <Check className="h-3 w-3 text-white" strokeWidth={3} />
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
                        <Icon className="h-6 w-6" strokeWidth={1.8} />
                      </span>
                      <div>
                        <p
                          className={`text-sm font-bold ${selected ? "text-[var(--foreground)]" : "text-[var(--brand-muted)]"}`}
                        >
                          {t(titleKey)}
                        </p>
                        <p className="mt-0.5 text-[11px] leading-snug text-[var(--brand-muted)]">
                          {t(descKey)}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
              {role === "seller" && !sellerPanelOpen && step === "role" && (
                <p className="text-center text-xs font-medium text-[var(--brand-red)]">
                  {agreedToSellerTerms ? t("sellerReadyToCreate") : t("sellerContinueHint")}
                </p>
              )}
              <button
                type="button"
                disabled={!role}
                onClick={handleRoleContinue}
                className={`${isSeller ? "clay-btn-red" : "clay-btn-blue"} mt-2 flex w-full items-center justify-center gap-2 py-3.5 text-base disabled:opacity-40`}
              >
                {t("continue")} <ArrowRight className="h-4 w-4" />
              </button>
              <p className="pt-1 text-center text-sm text-[var(--brand-muted)]">
                {t("alreadyHaveAccount")}{" "}
                <Link href="/login" className="font-semibold text-[var(--brand-blue)] hover:underline">
                  {t("signIn")}
                </Link>
              </p>
            </SignupStepPanel>
          )}

          {step === "details" && role && (
            <SignupStepPanel stepKey={`${role}-details`}>
              <div
                className={`mb-5 inline-flex items-center gap-2 ${isSeller ? "clay-badge-red" : "clay-badge-blue"}`}
                style={{ borderRadius: 999, padding: "6px 12px" }}
              >
                {isSeller ? <Store className="h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
                <span className="text-xs font-bold capitalize">{role} account</span>
                <button
                  type="button"
                  onClick={handleDetailsBack}
                  className="ml-1 opacity-60 hover:opacity-100"
                  aria-label={t("back")}
                >
                  <ArrowLeft className="h-3 w-3" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-2xl border border-[var(--brand-red)]/35 bg-[var(--brand-red)]/12 px-4 py-3 text-sm text-[var(--brand-red)]">
                    {error}
                  </div>
                )}
                <div>
                  <label htmlFor="signup-name" className="mb-2 block text-sm font-semibold">
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
                  <label htmlFor="signup-email" className="mb-2 block text-sm font-semibold">
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
                  <label htmlFor="signup-password" className="mb-2 block text-sm font-semibold">
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
                  <label htmlFor="signup-confirm" className="mb-2 block text-sm font-semibold">
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
                  <div className="flex flex-wrap gap-1.5">
                    {pwdChecks.map(({ label, ok }) => (
                      <span
                        key={label}
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                          ok
                            ? "border-emerald-500/35 bg-emerald-500/15 text-emerald-600"
                            : "border-neutral-200 bg-neutral-100 text-[var(--brand-muted)]"
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
                  className={`${isSeller ? "clay-btn-red" : "clay-btn-blue"} w-full py-3.5 text-base disabled:opacity-60`}
                >
                  {loading ? t("creatingAccount") : t("createAccount")}
                </button>
              </form>
              <p className="mt-5 text-center text-sm text-[var(--brand-muted)]">
                {t("alreadyHaveAccount")}{" "}
                <Link href="/login" className="font-semibold text-[var(--brand-blue)] hover:underline">
                  {t("signIn")}
                </Link>
              </p>
            </SignupStepPanel>
          )}
        </AnimatePresence>
      </AuthLayout>

      <SellerSignupSlidePanel
        open={sellerPanelOpen}
        onClose={closeSellerPanel}
        agreedToSellerTerms={agreedToSellerTerms}
        onAgreedChange={(v) => {
          setAgreedToSellerTerms(v);
          if (v) setError("");
        }}
        onAgreementContinue={handleAgreementContinue}
        error={sellerPanelOpen ? error : ""}
      />
    </RedirectIfAuthed>
  );
}
