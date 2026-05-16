"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Award,
  BadgeCheck,
  Building2,
  Camera,
  ChevronRight,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Star,
  Store,
  TrendingUp,
  Truck,
  X,
  Zap,
} from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { getBackendBaseUrl } from "@/config/env";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  sellerProfileDeactivate,
  sellerProfileGet,
  sellerProfileUpdate,
  sellerSettingsUploadLogo,
  type SellerProfile,
  type SellerProfileUpdate,
} from "@/lib/api";

const BADGE_STYLES: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  amber: "bg-amber-50 text-amber-800 border-amber-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
};

const BADGE_ICONS: Record<string, typeof Truck> = {
  "fast-ship": Truck,
  "top-rated": Star,
  member: Award,
  response: Zap,
};

function formatReviewCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

function shopInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "BC";
}

function resolveLogoUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = getBackendBaseUrl().replace(/\/$/, "");
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}

function ShopProfileAvatar({
  displayName,
  logoUrl,
  initials,
}: {
  displayName: string;
  logoUrl: string;
  initials: string;
}) {
  const [imgError, setImgError] = useState(false);
  const resolved = resolveLogoUrl(logoUrl);
  const showImage = Boolean(resolved) && !imgError;

  return (
    <div className="relative shrink-0" style={{ width: 112, height: 112 }}>
      <div
        className="absolute -inset-1 rounded-[18px] bg-gradient-to-br from-neutral-200/80 to-neutral-300/60 opacity-90"
        aria-hidden
      />
      <div className="relative h-[112px] w-[112px] overflow-hidden rounded-2xl border-[5px] border-white bg-gradient-to-br from-slate-800 via-slate-900 to-black shadow-[0_10px_28px_rgba(15,23,42,0.22)] ring-1 ring-black/5">
        {showImage ? (
          <Image
            src={resolved}
            alt={displayName}
            fill
            className="object-cover"
            sizes="112px"
            onError={() => setImgError(true)}
            unoptimized={resolved.includes("localhost")}
          />
        ) : (
          <>
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 25% 20%, rgba(255,255,255,0.12) 0%, transparent 45%), radial-gradient(circle at 80% 90%, rgba(198,40,40,0.25) 0%, transparent 50%)",
              }}
              aria-hidden
            />
            <Store
              className="absolute right-2.5 bottom-2.5 h-9 w-9 text-white/[0.12]"
              strokeWidth={1.5}
              aria-hidden
            />
            <span className="absolute inset-0 flex items-center justify-center text-[1.65rem] font-bold tracking-tight text-white">
              {initials}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, children }: { icon: typeof FileText; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-[var(--brand-red)]">
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
      </span>
      <h2 className="text-base font-semibold text-[var(--foreground)]">{children}</h2>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <dt className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{children}</dt>
  );
}

function StatBar({
  label,
  value,
  display,
  colorClass,
}: {
  label: string;
  value: number;
  display: string;
  colorClass: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-600">{label}</span>
        <span className="font-semibold text-[var(--foreground)]">{display}</span>
      </div>
      <div className="h-2.5 rounded-full bg-neutral-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

const MAX_LOGO_BYTES = 5 * 1024 * 1024;

export function SellerProfileView() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const t = useTranslations("sellerProfile");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editLogoUrl, setEditLogoUrl] = useState("");
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [form, setForm] = useState<SellerProfileUpdate>({});

  const load = useCallback(() => {
    setLoading(true);
    sellerProfileGet()
      .then(setProfile)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const initials = useMemo(
    () => shopInitials(profile?.shopDisplayName ?? "Shop"),
    [profile?.shopDisplayName],
  );

  function openEdit() {
    if (!profile) return;
    setEditLogoUrl(profile.shopLogoUrl ?? "");
    setForm({
      name: profile.name ?? "",
      shopTagline: profile.shopTagline,
      shopDisplayName: profile.shopDisplayName,
      businessName: profile.businessName,
      panVat: profile.panVat === "—" ? "" : profile.panVat,
      businessAddress: profile.businessAddress === "—" ? "" : profile.businessAddress,
      phone: profile.phone === "—" ? "" : profile.phone,
      locationLabel: profile.locationLabel,
    });
    setEditOpen(true);
  }

  async function handlePhotoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("imageTypeError"));
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error(t("imageSizeError"));
      return;
    }
    setUploadingPhoto(true);
    const url = await sellerSettingsUploadLogo(file);
    setUploadingPhoto(false);
    if (url) {
      setEditLogoUrl(url);
      setProfile((p) => (p ? { ...p, shopLogoUrl: url } : p));
      toast.success(t("photoUpdated"));
    } else {
      toast.error(t("photoFailed"));
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const updated = await sellerProfileUpdate(form);
    setSaving(false);
    if (updated) {
      setProfile(updated);
      if (form.name && user) setUser({ ...user, name: form.name });
      setEditOpen(false);
    }
  }

  async function handleDeactivate() {
    setDeactivating(true);
    const ok = await sellerProfileDeactivate();
    setDeactivating(false);
    if (ok) {
      setProfile((p) => (p ? { ...p, shopActive: false } : p));
      setDeactivateOpen(false);
    }
  }

  if (loading && !profile) {
    return (
      <div className="space-y-6">
        <div className="h-52 rounded-xl bg-neutral-100 animate-pulse" />
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="h-44 clay-card animate-pulse bg-neutral-50" />
          <div className="h-44 clay-card animate-pulse bg-neutral-50" />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="h-64 clay-card animate-pulse bg-neutral-50" />
          <div className="h-64 clay-card animate-pulse bg-neutral-50" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return <p className="text-sm text-neutral-500">{t("loadError")}</p>;
  }

  const ratingDisplay = profile.rating > 0 ? profile.rating.toFixed(1) : "—";
  const ratingBarPct = profile.rating > 0 ? (profile.rating / 5) * 100 : 0;
  const qualityPct = (profile.performance.productQuality / 5) * 100;

  return (
    <div className="space-y-5 w-full">
      {/* Shop header */}
      <div className="clay-card overflow-hidden p-0 bg-white">
        <div className="relative h-[108px] sm:h-[116px] bg-gradient-to-br from-[#c62828] via-[#d32f2f] to-[#b71c1c] flex items-center justify-center px-6 overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.14]"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 80% 60% at 50% 0%, #fff 0%, transparent 70%)",
            }}
            aria-hidden
          />
          <p className="relative z-10 text-lg sm:text-xl font-black uppercase tracking-[0.2em] text-white select-none text-center drop-shadow-sm">
            {profile.shopTagline}
          </p>
        </div>
        <div className="relative px-5 sm:px-8 pb-6 sm:pb-7 bg-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-5 min-w-0 -mt-14 sm:-mt-[3.25rem]">
              <ShopProfileAvatar
                displayName={profile.shopDisplayName}
                logoUrl={profile.shopLogoUrl ?? ""}
                initials={initials}
              />
              <div className="min-w-0 sm:pb-1 pt-1 sm:pt-0">
                <h1 className="text-xl sm:text-[1.65rem] font-bold text-[var(--foreground)] truncate leading-tight">
                  {profile.shopDisplayName}
                </h1>
                <p className="flex items-center gap-1.5 text-sm text-neutral-500 mt-1.5">
                  <MapPin className="w-4 h-4 shrink-0 text-[var(--brand-red)]" strokeWidth={2.5} />
                  <span className="truncate">{profile.locationLabel}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={openEdit}
              className="shrink-0 inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--brand-red)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#b71c1c] transition-colors self-start sm:mb-1"
            >
              <Pencil className="w-4 h-4" />
              {t("editProfile")}
            </button>
          </div>
          {!profile.shopActive && (
            <p className="mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {t("shopInactive")}
            </p>
          )}
        </div>
      </div>

      {/* Rating + Badges */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="clay-card p-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-3">
            {t.has("sellerRating") ? t("sellerRating") : "Seller rating"}
          </p>
          <div className="flex items-center gap-2">
            <Star className="w-7 h-7 text-[var(--brand-red)] fill-[var(--brand-red)] shrink-0" />
            <span className="text-4xl font-bold text-[var(--foreground)] leading-none">{ratingDisplay}</span>
            <span className="text-xl text-neutral-400 font-medium pb-1">/ 5.0</span>
          </div>
          <div className="mt-4 h-2.5 rounded-full bg-neutral-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--brand-red)] transition-all duration-500"
              style={{ width: `${ratingBarPct}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-neutral-500">
            {t("ratingBasedOn", { count: formatReviewCount(profile.ratingCount) })}
          </p>
        </div>

        <div className="clay-card p-6">
          <h2 className="text-base font-semibold text-[var(--foreground)] mb-4">{t("badges")}</h2>
          <div className="flex flex-wrap gap-2.5">
            {profile.badges.length === 0 ? (
              <p className="text-sm text-neutral-500">{t("noBadges")}</p>
            ) : (
              profile.badges.map((b) => {
                const Icon = BADGE_ICONS[b.id] ?? Award;
                return (
                  <span
                    key={b.id}
                    className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold ${BADGE_STYLES[b.tone] ?? BADGE_STYLES.blue}`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                    {b.label}
                  </span>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Business + Performance */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="clay-card p-6">
          <SectionTitle icon={Building2}>{t("businessInfo")}</SectionTitle>
          <dl className="space-y-4">
            <div>
              <FieldLabel>{t("registeredName")}</FieldLabel>
              <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">{profile.businessName}</dd>
            </div>
            <div>
              <FieldLabel>{t("panVat")}</FieldLabel>
              <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">{profile.panVat}</dd>
            </div>
            <div>
              <FieldLabel>{t("businessAddress")}</FieldLabel>
              <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">{profile.businessAddress}</dd>
            </div>
          </dl>
          <div
            className="mt-5 h-44 rounded-xl border border-neutral-200 bg-gradient-to-b from-neutral-100 to-neutral-200 relative overflow-hidden"
            aria-hidden
          >
            <div
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(0,0,0,0.03) 20px, rgba(0,0,0,0.03) 21px), repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0,0,0,0.03) 20px, rgba(0,0,0,0.03) 21px)",
              }}
            />
            <MapPin
              className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-full w-9 h-9 text-[var(--brand-red)] drop-shadow-sm"
              fill="var(--brand-red)"
              strokeWidth={1.5}
            />
          </div>
        </div>

        <div className="clay-card p-6">
          <SectionTitle icon={TrendingUp}>{t("performanceStats")}</SectionTitle>
          <div className="space-y-5">
            <StatBar
              label={t("orderFulfillment")}
              value={profile.performance.orderFulfillment}
              display={`${profile.performance.orderFulfillment}%`}
              colorClass="bg-emerald-500"
            />
            <StatBar
              label={t("responseRate")}
              value={profile.performance.responseRate}
              display={`${profile.performance.responseRate}%`}
              colorClass="bg-[var(--brand-blue)]"
            />
            <StatBar
              label={t("productQuality")}
              value={qualityPct}
              display={`${profile.performance.productQuality.toFixed(1)}/5`}
              colorClass="bg-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Contact + Policies / Danger */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="clay-card p-6">
          <SectionTitle icon={FileText}>{t("contactDetails")}</SectionTitle>
          <ul className="space-y-3">
            <li className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-neutral-50/80 px-4 py-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[var(--brand-red)]">
                <Mail className="w-5 h-5" strokeWidth={2} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  {t("supportEmail")}
                </p>
                <p className="text-sm font-medium text-[var(--foreground)] truncate mt-0.5">
                  {profile.email}
                </p>
              </div>
              <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0" aria-label={t("verified")} />
            </li>
            <li className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-neutral-50/80 px-4 py-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[var(--brand-red)]">
                <Phone className="w-5 h-5" strokeWidth={2} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  {t("phoneNumber")}
                </p>
                <p className="text-sm font-medium text-[var(--foreground)] mt-0.5">{profile.phone}</p>
              </div>
              {profile.phone !== "—" && profile.kycVerified ? (
                <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0" aria-label={t("verified")} />
              ) : (
                <span className="text-xs font-medium text-neutral-400 shrink-0">{t("unverified")}</span>
              )}
            </li>
          </ul>
        </div>

        <div className="space-y-5">
          <div className="clay-card p-6">
            <h2 className="text-base font-semibold text-[var(--foreground)] mb-1">{t("shopPolicies")}</h2>
            <ul>
              {[t("policyReturns"), t("policyShipping"), t("policyWarranty")].map((label) => (
                <li key={label} className="border-b border-neutral-100 last:border-0">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between py-3.5 text-sm font-medium text-[var(--foreground)] hover:text-[var(--brand-red)] transition-colors text-left"
                  >
                    {label}
                    <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <h2 className="text-base font-semibold text-red-900">{t("dangerZone")}</h2>
            <p className="text-sm text-red-800/90 mt-2 leading-relaxed">{t("dangerDesc")}</p>
            <button
              type="button"
              disabled={!profile.shopActive}
              onClick={() => setDeactivateOpen(true)}
              className="mt-4 w-full rounded-lg border-2 border-[var(--brand-red)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--brand-red)] hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {t("deactivateAccount")}
            </button>
          </div>
        </div>
      </div>

      {editOpen && profile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
          <div
            role="dialog"
            aria-labelledby="edit-profile-title"
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto clay-card p-6 sm:p-7 relative bg-white"
          >
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
              aria-label={t("cancel")}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 id="edit-profile-title" className="text-lg font-bold text-[var(--foreground)] pr-10">
              {t("editProfile")}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">{t("editProfileSubtitle")}</p>

            <form onSubmit={handleSave} className="mt-5 space-y-5">
              <section className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">
                  {t("shopPhoto")}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                  <div className="relative mx-auto sm:mx-0 shrink-0">
                    <ShopProfileAvatar
                      displayName={form.shopDisplayName || profile.shopDisplayName}
                      logoUrl={editLogoUrl}
                      initials={shopInitials(form.shopDisplayName || profile.shopDisplayName)}
                    />
                    {uploadingPhoto && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/45">
                        <Loader2 className="w-8 h-8 text-white animate-spin" aria-hidden />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <p className="text-sm text-neutral-600 leading-relaxed">{t("shopPhotoHint")}</p>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      onChange={handlePhotoPick}
                    />
                    <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <button
                        type="button"
                        disabled={uploadingPhoto}
                        onClick={() => photoInputRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-red)] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b71c1c] disabled:opacity-60 transition-colors"
                      >
                        {uploadingPhoto ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                        {uploadingPhoto ? t("uploadingPhoto") : t("changePhoto")}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-neutral-200 overflow-hidden">
                <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  {t("bannerPreview")}
                </p>
                <div className="relative mt-2 h-[72px] bg-gradient-to-br from-[#c62828] via-[#d32f2f] to-[#b71c1c] flex items-center justify-center px-4">
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.14]"
                    style={{
                      backgroundImage:
                        "radial-gradient(ellipse 80% 60% at 50% 0%, #fff 0%, transparent 70%)",
                    }}
                    aria-hidden
                  />
                  <p className="relative z-10 text-center text-sm sm:text-base font-black uppercase tracking-[0.15em] text-white line-clamp-2">
                    {(form.shopTagline || profile.shopTagline || t("bannerPlaceholder")).trim()}
                  </p>
                </div>
                <p className="px-4 py-2 text-xs text-neutral-500 bg-neutral-50 border-t border-neutral-100">
                  {t("bannerPreviewHint")}
                </p>
              </section>

              <div className="border-t border-neutral-100 pt-1 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  {t("shopDetails")}
                </p>
                {(
                  [
                    ["shopDisplayName", t("shopName")],
                    ["shopTagline", t("shopTagline")],
                    ["businessName", t("registeredName")],
                    ["panVat", t("panVat")],
                    ["businessAddress", t("businessAddress")],
                    ["locationLabel", t("location")],
                    ["phone", t("phoneNumber")],
                    ["name", t("ownerName")],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                      {label}
                    </label>
                    <input
                      type="text"
                      value={(form[key] as string) ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)]/20 focus:border-[var(--brand-red)]"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="flex-1 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingPhoto}
                  className="flex-1 rounded-lg bg-[var(--brand-red)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 hover:bg-[#b71c1c] transition-colors"
                >
                  {saving ? t("saving") : t("save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      <ConfirmModal
        open={deactivateOpen}
        title={t("deactivateConfirmTitle")}
        message={t("deactivateConfirmMessage")}
        confirmLabel={t("deactivateAccount")}
        variant="danger"
        loading={deactivating}
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateOpen(false)}
      />
    </div>
  );
}
