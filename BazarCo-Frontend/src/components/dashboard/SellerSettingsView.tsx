"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Bell,
  Camera,
  CreditCard,
  KeyRound,
  Package,
  Shield,
  Truck,
  User,
} from "lucide-react";
import {
  sellerSettingsGet,
  sellerSettingsUpdate,
  sellerSettingsUploadLogo,
  type SellerSettings,
} from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

type SettingsTab = "account" | "notifications" | "security" | "shipping" | "payouts";

const TABS: { id: SettingsTab; labelKey: string; Icon: typeof User }[] = [
  { id: "account", labelKey: "tabAccount", Icon: User },
  { id: "notifications", labelKey: "tabNotifications", Icon: Bell },
  { id: "security", labelKey: "tabSecurity", Icon: Shield },
  { id: "shipping", labelKey: "tabShipping", Icon: Truck },
  { id: "payouts", labelKey: "tabPayouts", Icon: CreditCard },
];

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-[var(--brand-blue)]" : "bg-neutral-300"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function parsePhone(stored: string): { code: string; local: string } {
  if (stored.startsWith("+977")) return { code: "+977", local: stored.slice(4) };
  if (stored.startsWith("+")) {
    const m = stored.match(/^(\+\d{1,4})(.*)$/);
    if (m) return { code: m[1]!, local: m[2]! };
  }
  return { code: "+977", local: stored };
}

export function SellerSettingsView() {
  const t = useTranslations("sellerSettings");
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<SettingsTab>("account");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SellerSettings | null>(null);
  const [shopDisplayName, setShopDisplayName] = useState("");
  const [phoneCode, setPhoneCode] = useState("+977");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [securityHint, setSecurityHint] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await sellerSettingsGet();
    if (data) {
      setSettings(data);
      setShopDisplayName(data.shopDisplayName);
      const ph = parsePhone(data.phone);
      setPhoneCode(ph.code);
      setPhoneLocal(ph.local);
      setLogoUrl(data.shopLogoUrl);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveAccount() {
    setSaving(true);
    const phone = phoneLocal.trim() ? `${phoneCode}${phoneLocal.replace(/\s/g, "")}` : "";
    const updated = await sellerSettingsUpdate({ shopDisplayName, phone });
    setSaving(false);
    if (updated) {
      setSettings(updated);
      toast.success(t("saved"));
    } else {
      toast.error(t("saveFailed"));
    }
  }

  async function patchNotif(patch: Parameters<typeof sellerSettingsUpdate>[0]) {
    const updated = await sellerSettingsUpdate(patch);
    if (updated) {
      setSettings(updated);
    } else {
      toast.error(t("saveFailed"));
      load();
    }
  }

  async function onLogoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const url = await sellerSettingsUploadLogo(file);
    setUploadingLogo(false);
    if (url) {
      setLogoUrl(url);
      toast.success(t("logoUpdated"));
      load();
    } else {
      toast.error(t("logoFailed"));
    }
    e.target.value = "";
  }

  if (loading && !settings) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-sm text-neutral-500">
        {t("loading")}
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{t("title")}</h1>
        <p className="mt-1 text-sm text-[var(--brand-muted)]">{t("subtitle")}</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="lg:w-52 shrink-0">
          <ul className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {TABS.map((item) => {
              const Icon = item.Icon;
              const active = tab === item.id;
              return (
                <li key={item.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap ${
                      active
                        ? "bg-red-50 text-[var(--brand-red)]"
                        : "text-[var(--brand-muted)] hover:bg-[var(--input-bg)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {t(item.labelKey)}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex-1 min-w-0 space-y-6">
          {tab === "account" && (
            <div className="clay-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-[var(--foreground)]">{t("accountDetails")}</h2>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-muted)] mt-1">
                    {t("accountSubtitle")}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={saveAccount}
                  className="shrink-0 rounded-lg bg-[var(--brand-red)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-red)]/90 disabled:opacity-60"
                >
                  {saving ? t("saving") : t("saveChanges")}
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--brand-muted)] mb-1.5">
                    {t("storeName")}
                  </label>
                  <input
                    type="text"
                    value={shopDisplayName}
                    onChange={(e) => setShopDisplayName(e.target.value)}
                    className="w-full rounded-lg border border-[var(--brand-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--brand-muted)] mb-1.5">
                    {t("registeredEmail")}
                  </label>
                  <input
                    type="email"
                    readOnly
                    value={settings?.email ?? ""}
                    className="w-full rounded-lg border border-[var(--brand-border)] bg-neutral-100 px-3 py-2.5 text-sm text-neutral-500"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--brand-muted)] mb-2">
                  {t("storeLogo")}
                </label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-lg border border-[var(--brand-border)] bg-[var(--input-bg)] overflow-hidden relative flex items-center justify-center">
                    {logoUrl ? (
                      <Image src={logoUrl} alt="" fill className="object-cover" sizes="80px" />
                    ) : (
                      <Camera className="h-8 w-8 text-neutral-400" />
                    )}
                  </div>
                  <div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onLogoPick} />
                    <button
                      type="button"
                      disabled={uploadingLogo}
                      onClick={() => fileRef.current?.click()}
                      className="text-sm font-semibold text-[var(--brand-blue)] hover:underline disabled:opacity-50"
                    >
                      {uploadingLogo ? t("uploading") : t("replaceLogo")}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--brand-muted)] mb-1.5">
                  {t("phoneNumber")}
                </label>
                <div className="flex gap-2 max-w-md">
                  <select
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
                    className="w-24 rounded-lg border border-[var(--brand-border)] bg-[var(--input-bg)] px-2 py-2.5 text-sm"
                  >
                    <option value="+977">+977</option>
                    <option value="+61">+61</option>
                    <option value="+1">+1</option>
                  </select>
                  <input
                    type="tel"
                    value={phoneLocal}
                    onChange={(e) => setPhoneLocal(e.target.value)}
                    className="flex-1 rounded-lg border border-[var(--brand-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm"
                    placeholder="98XXXXXXXX"
                  />
                </div>
              </div>
            </div>
          )}

          {tab === "notifications" && settings && (
            <div className="clay-card p-6">
              <h2 className="text-lg font-bold text-[var(--foreground)] mb-6">{t("notificationChannels")}</h2>
              <ul className="divide-y divide-[var(--brand-border)]">
                {[
                  {
                    key: "notifyOrderUpdates" as const,
                    title: t("notifOrders"),
                    desc: t("notifOrdersDesc"),
                    value: settings.notifications.orderUpdates,
                  },
                  {
                    key: "notifyInventoryAlerts" as const,
                    title: t("notifInventory"),
                    desc: t("notifInventoryDesc"),
                    value: settings.notifications.inventoryAlerts,
                  },
                  {
                    key: "notifyMarketing" as const,
                    title: t("notifMarketing"),
                    desc: t("notifMarketingDesc"),
                    value: settings.notifications.marketingInsights,
                  },
                ].map((row) => (
                  <li key={row.key} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">{row.title}</p>
                      <p className="text-sm text-[var(--brand-muted)] mt-0.5">{row.desc}</p>
                    </div>
                    <Toggle
                      label={row.title}
                      checked={row.value}
                      onChange={(v) => patchNotif({ [row.key]: v })}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tab === "security" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="clay-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-[var(--brand-blue)] mb-4">
                  <Shield className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold">{t("securityTitle")}</h2>
                <p className="text-sm text-[var(--brand-muted)] mt-2">{t("securityDesc")}</p>
                <button
                  type="button"
                  onClick={() => setSecurityHint(true)}
                  className="mt-4 rounded-lg border-2 border-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-[var(--brand-blue)] hover:bg-blue-50"
                >
                  {t("enable2fa")}
                </button>
              </div>
              <div className="clay-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-[var(--brand-red)] mb-4">
                  <KeyRound className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold">{t("passwordTitle")}</h2>
                <p className="text-sm text-[var(--brand-muted)] mt-2">{t("passwordDesc")}</p>
                <Link
                  href="/forgot-password"
                  className="mt-4 inline-flex rounded-lg border-2 border-[var(--brand-red)] px-4 py-2 text-sm font-semibold text-[var(--brand-red)] hover:bg-red-50"
                >
                  {t("changePassword")}
                </Link>
              </div>
              {securityHint && (
                <p className="sm:col-span-2 text-sm text-[var(--brand-blue)] bg-blue-50 border border-blue-100 rounded-lg px-4 py-2">
                  {t("twoFactorComingSoon")}
                </p>
              )}
            </div>
          )}

          {tab === "shipping" && settings && (
            <div className="clay-card overflow-hidden">
              <div className="flex items-center justify-between bg-emerald-600 px-5 py-3 text-white">
                <h2 className="font-bold">{t("shippingPreferences")}</h2>
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">{t("active")}</span>
              </div>
              <ul className="divide-y divide-[var(--brand-border)] p-2">
                <li className="flex items-start justify-between gap-4 p-4">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-[var(--brand-blue)]">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{t("standardHub")}</p>
                        {settings.shipping.standardHub && (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                            {t("defaultTag")}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--brand-muted)] mt-1">{t("standardHubDesc")}</p>
                    </div>
                  </div>
                  <Toggle
                    label={t("standardHub")}
                    checked={settings.shipping.standardHub}
                    onChange={(v) => patchNotif({ shippingStandardHub: v })}
                  />
                </li>
                <li className="flex items-start justify-between gap-4 p-4">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-[var(--brand-blue)]">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{t("doorstepPickup")}</p>
                      <p className="text-sm text-[var(--brand-muted)] mt-1">{t("doorstepDesc")}</p>
                      {!settings.shipping.doorstep && (
                        <button
                          type="button"
                          onClick={() => patchNotif({ shippingDoorstep: true })}
                          className="mt-2 text-sm font-semibold text-[var(--brand-blue)] hover:underline"
                        >
                          {t("activate")}
                        </button>
                      )}
                    </div>
                  </div>
                  <Toggle
                    label={t("doorstepPickup")}
                    checked={settings.shipping.doorstep}
                    onChange={(v) => patchNotif({ shippingDoorstep: v })}
                  />
                </li>
              </ul>
            </div>
          )}

          {tab === "payouts" && (
            <div className="clay-card p-8 text-center">
              <CreditCard className="mx-auto h-10 w-10 text-neutral-400 mb-3" />
              <h2 className="text-lg font-bold">{t("payoutsTitle")}</h2>
              <p className="text-sm text-[var(--brand-muted)] mt-2 max-w-md mx-auto">{t("payoutsDesc")}</p>
              <Link
                href="/dashboard/kyc"
                className="inline-block mt-4 text-sm font-semibold text-[var(--brand-blue)] hover:underline"
              >
                {t("completeKyc")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
