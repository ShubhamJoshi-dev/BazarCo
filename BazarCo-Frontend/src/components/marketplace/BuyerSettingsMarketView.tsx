"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Bell,
  HelpCircle,
  Lock,
  Monitor,
  Palette,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency, type Currency, CURRENCY_META } from "@/contexts/CurrencyContext";
import {
  authUpdateProfile,
  createAddress,
  deleteAddress,
  listAddresses,
  type Address,
  type ShippingAddressInput,
} from "@/lib/api";

type TabId = "account" | "notifications" | "display" | "privacy" | "help";

const TABS: { id: TabId; labelKey: string; Icon: LucideIcon }[] = [
  { id: "account", labelKey: "tabAccount", Icon: User },
  { id: "notifications", labelKey: "tabNotifications", Icon: Bell },
  { id: "display", labelKey: "tabDisplay", Icon: Palette },
  { id: "privacy", labelKey: "tabPrivacy", Icon: Shield },
  { id: "help", labelKey: "tabHelp", Icon: HelpCircle },
];

const PREFS_KEY = "bazarco_buyer_prefs";

type BuyerPrefs = {
  orderUpdates: boolean;
  flashSales: boolean;
  marketing: boolean;
  twoFactor: boolean;
};

function loadPrefs(): BuyerPrefs {
  if (typeof window === "undefined") {
    return { orderUpdates: true, flashSales: false, marketing: true, twoFactor: true };
  }
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...loadPrefsDefaults(), ...(JSON.parse(raw) as Partial<BuyerPrefs>) };
  } catch {
    /* ignore */
  }
  return loadPrefsDefaults();
}

function loadPrefsDefaults(): BuyerPrefs {
  return { orderUpdates: true, flashSales: false, marketing: true, twoFactor: true };
}

function savePrefs(prefs: BuyerPrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function BuyerSettingsMarketView() {
  const t = useTranslations("buyerSettings");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, setUser } = useAuth();
  const { currency, setCurrency } = useCurrency();

  const tabParam = (searchParams.get("tab") as TabId) || "account";
  const [activeTab, setActiveTab] = useState<TabId>(
    TABS.some((x) => x.id === tabParam) ? tabParam : "account",
  );

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<"saved" | "error" | null>(null);
  const [prefs, setPrefs] = useState<BuyerPrefs>(loadPrefsDefaults);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressForm, setAddressForm] = useState<ShippingAddressInput & { label: string }>({
    label: "Home",
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
    country: "Nepal",
    phone: "",
  });

  useEffect(() => {
    setPrefs(loadPrefs());
    listAddresses().then(setAddresses);
  }, []);

  useEffect(() => {
    setName(user?.name ?? "");
  }, [user?.name]);

  useEffect(() => {
    const tab = searchParams.get("tab") as TabId;
    if (tab && TABS.some((x) => x.id === tab)) setActiveTab(tab);
  }, [searchParams]);

  const setTab = (id: TabId) => {
    setActiveTab(id);
    router.replace(`/dashboard/settings?tab=${id}`, { scroll: false });
  };

  const updatePref = (key: keyof BuyerPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    savePrefs(next);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const updated = await authUpdateProfile(name);
    setSaving(false);
    if (updated) {
      setUser(updated);
      setMessage("saved");
    } else {
      setMessage("error");
    }
  };

  const loadAddresses = useCallback(() => {
    listAddresses().then(setAddresses);
  }, []);

  return (
    <div className="w-full max-w-[1000px] mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black">{t("title")}</h1>
        <p className="text-sm text-[var(--brand-muted)] mt-1">{t("subtitle")}</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        <nav className="lg:w-52 shrink-0 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.Icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTab(tab.id)}
                className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? "bg-[var(--brand-red)]/10 text-[var(--brand-red)] border-l-4 border-[var(--brand-red)]"
                    : "text-[var(--brand-muted)] hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {t(tab.labelKey)}
              </button>
            );
          })}
        </nav>

        <div className="flex-1 min-w-0 space-y-6">
          {activeTab === "account" && (
            <>
              <section className="rounded-xl border border-neutral-200 bg-white dark:bg-[var(--card-bg)] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold">{t("personalInfo")}</h2>
                  <Link href="/dashboard/profile" className="text-sm font-semibold text-sky-600 hover:underline">
                    {t("viewProfile")}
                  </Link>
                </div>
                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
                  <Field label={t("fullName")}>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label={t("email")}>
                    <input type="email" value={user?.email ?? ""} disabled className={`${inputClass} opacity-60`} />
                  </Field>
                  <Field label={t("phone")}>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t("phonePlaceholder")}
                      className={inputClass}
                    />
                  </Field>
                  <Field label={t("defaultCurrency")}>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as Currency)}
                      className={inputClass}
                    >
                      {(Object.keys(CURRENCY_META) as Currency[]).map((c) => (
                        <option key={c} value={c}>
                          {CURRENCY_META[c].label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  {message === "saved" && <p className="text-sm text-emerald-600">{t("saved")}</p>}
                  {message === "error" && <p className="text-sm text-[var(--brand-red)]">{t("saveError")}</p>}
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-[var(--brand-red)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#b71c1c] disabled:opacity-60"
                  >
                    {saving ? t("saving") : t("saveChanges")}
                  </button>
                </form>
              </section>

              <div className="grid sm:grid-cols-2 gap-4">
                <MiniCard
                  icon={<Lock className="h-5 w-5 text-[var(--brand-red)]" />}
                  title={t("twoFactorTitle")}
                  subtitle={prefs.twoFactor ? t("statusActive") : t("statusInactive")}
                  action={
                    <button
                      type="button"
                      onClick={() => updatePref("twoFactor", !prefs.twoFactor)}
                      className="text-sm font-semibold text-[var(--brand-red)] hover:underline"
                    >
                      {prefs.twoFactor ? t("disable") : t("enable")}
                    </button>
                  }
                />
                <MiniCard
                  icon={<Monitor className="h-5 w-5 text-sky-600" />}
                  title={t("devicesTitle")}
                  subtitle={t("devicesSubtitle")}
                  action={
                    <button type="button" className="text-sm font-semibold text-sky-600 hover:underline">
                      {t("reviewDevices")}
                    </button>
                  }
                />
              </div>

              <section className="rounded-xl border border-neutral-200 bg-white dark:bg-[var(--card-bg)] p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4">{t("savedAddresses")}</h2>
                <ul className="space-y-2 mb-4">
                  {addresses.map((addr) => (
                    <li
                      key={addr.id}
                      className="flex justify-between gap-2 rounded-lg border border-neutral-100 p-3 text-sm"
                    >
                      <div>
                        <p className="font-semibold">{addr.label}</p>
                        <p className="text-[var(--brand-muted)] text-xs">
                          {addr.line1}, {addr.city}, {addr.country}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(t("deleteAddressConfirm"))) {
                            await deleteAddress(addr.id);
                            loadAddresses();
                          }
                        }}
                        className="text-neutral-400 hover:text-[var(--brand-red)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!addressForm.line1.trim() || !addressForm.city.trim()) return;
                    const created = await createAddress({ ...addressForm, isDefault: addresses.length === 0 });
                    if (created) {
                      loadAddresses();
                      setAddressForm({
                        label: "Home",
                        line1: "",
                        line2: "",
                        city: "",
                        state: "",
                        zip: "",
                        country: "Nepal",
                        phone: "",
                      });
                    }
                  }}
                  className="grid gap-2 sm:grid-cols-2"
                >
                  <input
                    placeholder={t("addressLabel")}
                    value={addressForm.label}
                    onChange={(e) => setAddressForm((f) => ({ ...f, label: e.target.value }))}
                    className={inputClass}
                  />
                  <input
                    placeholder={t("addressLine1")}
                    value={addressForm.line1}
                    onChange={(e) => setAddressForm((f) => ({ ...f, line1: e.target.value }))}
                    className={inputClass}
                    required
                  />
                  <input
                    placeholder={t("city")}
                    value={addressForm.city}
                    onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))}
                    className={inputClass}
                    required
                  />
                  <input
                    placeholder={t("country")}
                    value={addressForm.country}
                    onChange={(e) => setAddressForm((f) => ({ ...f, country: e.target.value }))}
                    className={inputClass}
                    required
                  />
                  <button
                    type="submit"
                    className="sm:col-span-2 rounded-lg border border-dashed border-neutral-300 py-2 text-sm font-semibold hover:border-[var(--brand-red)]"
                  >
                    + {t("addAddress")}
                  </button>
                </form>
              </section>

              <NotificationSection prefs={prefs} updatePref={updatePref} t={t} />

              <DangerZone t={t} />
            </>
          )}

          {activeTab === "notifications" && (
            <NotificationSection prefs={prefs} updatePref={updatePref} t={t} full />
          )}

          {activeTab === "display" && (
            <section className="rounded-xl border border-neutral-200 bg-white dark:bg-[var(--card-bg)] p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold">{t("tabDisplay")}</h2>
              <Field label={t("defaultCurrency")}>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className={inputClass}
                >
                  {(Object.keys(CURRENCY_META) as Currency[]).map((c) => (
                    <option key={c} value={c}>
                      {CURRENCY_META[c].label}
                    </option>
                  ))}
                </select>
              </Field>
              <p className="text-sm text-[var(--brand-muted)]">{t("displayHint")}</p>
            </section>
          )}

          {activeTab === "privacy" && (
            <>
              <section className="rounded-xl border border-neutral-200 bg-white dark:bg-[var(--card-bg)] p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4">{t("privacyTitle")}</h2>
                <MiniCard
                  icon={<Lock className="h-5 w-5 text-[var(--brand-red)]" />}
                  title={t("twoFactorTitle")}
                  subtitle={prefs.twoFactor ? t("statusActive") : t("statusInactive")}
                  action={
                    <button
                      type="button"
                      onClick={() => updatePref("twoFactor", !prefs.twoFactor)}
                      className="text-sm font-semibold text-[var(--brand-red)]"
                    >
                      {prefs.twoFactor ? t("disable") : t("enable")}
                    </button>
                  }
                />
                <p className="text-sm text-[var(--brand-muted)] mt-4">{t("changePasswordHint")}</p>
              </section>
              <DangerZone t={t} />
            </>
          )}

          {activeTab === "help" && (
            <section className="rounded-xl border border-neutral-200 bg-white dark:bg-[var(--card-bg)] p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4">{t("tabHelp")}</h2>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/dashboard/chat" className="font-medium text-[var(--brand-red)] hover:underline">
                    {t("helpContact")}
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/browse" className="text-[var(--brand-muted)] hover:text-[var(--foreground)]">
                    {t("helpShipping")}
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/orders" className="text-[var(--brand-muted)] hover:text-[var(--foreground)]">
                    {t("helpReturns")}
                  </Link>
                </li>
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-neutral-200 bg-white dark:bg-[var(--card-bg)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)]/20 focus:border-[var(--brand-red)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function MiniCard({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white dark:bg-[var(--card-bg)] p-4 flex gap-3 items-start">
      <span className="shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold">{title}</p>
        <p className="text-xs text-[var(--brand-muted)] mt-0.5">{subtitle}</p>
        <div className="mt-2">{action}</div>
      </div>
    </div>
  );
}

function NotificationSection({
  prefs,
  updatePref,
  t,
  full,
}: {
  prefs: BuyerPrefs;
  updatePref: (k: keyof BuyerPrefs, v: boolean) => void;
  t: (k: string) => string;
  full?: boolean;
}) {
  const items = [
    { key: "orderUpdates" as const, label: t("prefOrders") },
    { key: "flashSales" as const, label: t("prefFlash") },
    { key: "marketing" as const, label: t("prefMarketing") },
  ];
  return (
    <section
      className={`rounded-xl border border-neutral-200 bg-white dark:bg-[var(--card-bg)] p-6 shadow-sm ${full ? "" : ""}`}
    >
      <h2 className="text-lg font-bold mb-4">{t("notificationPrefs")}</h2>
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.key} className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">{item.label}</span>
            <Toggle checked={prefs[item.key]} onChange={(v) => updatePref(item.key, v)} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-neutral-300"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

function DangerZone({ t }: { t: (k: string) => string }) {
  return (
    <section className="rounded-xl border border-red-200 bg-red-50/50 dark:bg-red-950/20 p-6">
      <h2 className="text-lg font-bold text-red-800 dark:text-red-300">{t("dangerZone")}</h2>
      <p className="text-sm text-red-700/80 dark:text-red-400/80 mt-2 max-w-lg">{t("dangerDesc")}</p>
      <div className="flex flex-wrap gap-3 mt-4">
        <button
          type="button"
          onClick={() => alert(t("deactivateSoon"))}
          className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
        >
          {t("deactivateAccount")}
        </button>
        <button
          type="button"
          onClick={() => alert(t("deleteSoon"))}
          className="rounded-lg bg-[var(--brand-red)] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b71c1c]"
        >
          {t("deleteData")}
        </button>
      </div>
    </section>
  );
}
