"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { User, Settings, MapPin, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { authUpdateProfile, listAddresses, createAddress, deleteAddress, type Address, type ShippingAddressInput } from "@/lib/api";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const t = useTranslations("profile");
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<"saved" | "error" | null>(null);
  const [activeSection, setActiveSection] = useState("profile");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressForm, setAddressForm] = useState<ShippingAddressInput & { label: string }>({
    label: "Home",
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    phone: "",
  });
  const [addingAddress, setAddingAddress] = useState(false);

  const loadAddresses = useCallback(() => {
    listAddresses().then(setAddresses);
  }, []);

  useEffect(() => {
    if (activeSection === "addresses") loadAddresses();
  }, [activeSection, loadAddresses]);

  useEffect(() => {
    setName(user?.name ?? "");
  }, [user?.name]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    const updated = await authUpdateProfile(name);
    setSaving(false);
    if (updated) {
      setUser(updated);
      setMessage("saved");
    } else {
      setMessage("error");
    }
  }

  return (
    <div className="flex gap-8 min-h-[60vh]">
      <motion.aside
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="w-56 shrink-0"
      >
        <div className="settings-card rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--brand-red)]/30 to-[var(--brand-blue)]/30 flex items-center justify-center text-[var(--brand-white)]">
              <User className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--brand-white)]">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-neutral-500">Your personal account</p>
            </div>
          </div>
        </div>
        <nav className="space-y-0.5">
          {[
            { id: "profile", labelKey: "publicProfile" as const, Icon: User },
            { id: "addresses", labelKey: "addresses" as const, Icon: MapPin },
            { id: "account", labelKey: "account" as const, Icon: Settings },
          ].map((item) => {
            const active = activeSection === item.id;
            const Icon = item.Icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all ${
                  active
                    ? "bg-[var(--brand-blue)]/15 text-[var(--brand-blue)] border border-[var(--brand-blue)]/30"
                    : "text-neutral-400 hover:bg-white/5 hover:text-[var(--brand-white)]"
                }`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
                {t(item.labelKey)}
              </button>
            );
          })}
        </nav>
      </motion.aside>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="flex-1 min-w-0"
      >
        {activeSection === "addresses" && (
          <div className="settings-card rounded-2xl border border-white/10 overflow-hidden card-glow">
            <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-white/[0.02]">
              <h2 className="text-lg font-bold text-[var(--brand-white)]">{t("addresses")}</h2>
              <Link href="/dashboard" className="text-sm text-[var(--brand-blue)] hover:underline">{t("backToDashboard")}</Link>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-sm text-neutral-400">{t("addressesHint")}</p>
              <ul className="space-y-3">
                {addresses.map((addr) => (
                  <li
                    key={addr.id}
                    className="flex items-start justify-between gap-4 rounded-xl bg-white/[0.03] p-4 border border-white/10"
                  >
                    <div>
                      <p className="font-medium text-[var(--brand-white)]">{addr.label}</p>
                      <p className="text-sm text-neutral-400">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                      <p className="text-sm text-neutral-400">{addr.city}, {addr.state && `${addr.state} `}{addr.zip} {addr.country}</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(t("deleteAddress"))) {
                          await deleteAddress(addr.id);
                          loadAddresses();
                        }
                      }}
                      className="p-2 rounded-lg text-neutral-400 hover:text-[var(--brand-red)] hover:bg-[var(--brand-red)]/10 transition-colors"
                      aria-label="Delete address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!addressForm.line1.trim() || !addressForm.city.trim() || !addressForm.country.trim()) return;
                  setAddingAddress(true);
                  const created = await createAddress({ ...addressForm, isDefault: addresses.length === 0 });
                  setAddingAddress(false);
                  if (created) {
                    loadAddresses();
                    setAddressForm({ label: "Home", line1: "", line2: "", city: "", state: "", zip: "", country: "", phone: "" });
                  }
                }}
                className="space-y-3 rounded-xl bg-white/[0.03] p-4 border border-white/10"
              >
                <h3 className="text-sm font-medium text-[var(--brand-white)]">{t("addAddress")}</h3>
                <input
                  type="text"
                  placeholder={t("labelPlaceholder")}
                  value={addressForm.label}
                  onChange={(e) => setAddressForm((f) => ({ ...f, label: e.target.value }))}
                  className="w-full rounded-lg bg-white/[0.06] border border-white/10 px-3 py-2 text-sm text-[var(--brand-white)] placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-[var(--brand-blue)]/50"
                />
                <input
                  type="text"
                  placeholder="Address line 1"
                  value={addressForm.line1}
                  onChange={(e) => setAddressForm((f) => ({ ...f, line1: e.target.value }))}
                  className="w-full rounded-lg bg-white/[0.06] border border-white/10 px-3 py-2 text-sm text-[var(--brand-white)] placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-[var(--brand-blue)]/50"
                  required
                />
                <input
                  type="text"
                  placeholder="Address line 2 (optional)"
                  value={addressForm.line2}
                  onChange={(e) => setAddressForm((f) => ({ ...f, line2: e.target.value }))}
                  className="w-full rounded-lg bg-white/[0.06] border border-white/10 px-3 py-2 text-sm text-[var(--brand-white)] placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-[var(--brand-blue)]/50"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="City"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full rounded-lg bg-white/[0.06] border border-white/10 px-3 py-2 text-sm text-[var(--brand-white)] placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-[var(--brand-blue)]/50"
                    required
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm((f) => ({ ...f, state: e.target.value }))}
                    className="w-full rounded-lg bg-white/[0.06] border border-white/10 px-3 py-2 text-sm text-[var(--brand-white)] placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-[var(--brand-blue)]/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="ZIP"
                    value={addressForm.zip}
                    onChange={(e) => setAddressForm((f) => ({ ...f, zip: e.target.value }))}
                    className="w-full rounded-lg bg-white/[0.06] border border-white/10 px-3 py-2 text-sm text-[var(--brand-white)] placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-[var(--brand-blue)]/50"
                  />
                  <input
                    type="text"
                    placeholder="Country"
                    value={addressForm.country}
                    onChange={(e) => setAddressForm((f) => ({ ...f, country: e.target.value }))}
                    className="w-full rounded-lg bg-white/[0.06] border border-white/10 px-3 py-2 text-sm text-[var(--brand-white)] placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-[var(--brand-blue)]/50"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={addingAddress}
                  className="rounded-lg bg-[var(--brand-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-blue)]/90 disabled:opacity-60"
                >
                  {addingAddress ? t("adding") : t("addAddress")}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeSection === "profile" && (
        <div className="settings-card rounded-2xl border border-white/10 overflow-hidden card-glow">
          <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-lg font-bold text-[var(--brand-white)]">
              {t("publicProfile")}
            </h2>
            <Link
              href="/dashboard"
              className="text-sm text-[var(--brand-blue)] hover:underline"
            >
              {t("backToDashboard")}
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              <label
                htmlFor="profile-name"
                className="block text-sm font-medium text-[var(--brand-white)]"
              >
                Name
              </label>
              <p className="text-xs text-neutral-500 mb-2">
                Your name may appear around BazarCo. You can change it anytime.
              </p>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[var(--brand-white)] placeholder:text-neutral-500 focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/30 transition-colors"
                placeholder="Your name"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="space-y-2"
            >
              <label className="block text-sm font-medium text-[var(--brand-white)]">
                Email
              </label>
              <p className="text-xs text-neutral-500 mb-2">
                Your account email. Contact support to change it.
              </p>
              <div className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-neutral-400">
                {user?.email}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <label className="block text-sm font-medium text-[var(--brand-white)]">
                Role
              </label>
              <p className="text-xs text-neutral-500 mb-2">
                Your account type on the marketplace.
              </p>
              <div
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                  user?.role === "seller"
                    ? "bg-[var(--brand-red)]/20 text-[var(--brand-red)] border border-[var(--brand-red)]/40"
                    : "bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] border border-[var(--brand-blue)]/40"
                }`}
              >
                <User className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
                <span className="capitalize">{user?.role}</span>
              </div>
            </motion.div>

            {message === "saved" && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-green-400"
              >
                Profile updated.
              </motion.p>
            )}
            {message === "error" && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-[var(--brand-red)]"
              >
                Failed to update. Try again.
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-blue)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] focus:ring-offset-2 focus:ring-offset-[var(--brand-black)] disabled:opacity-60 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {saving ? "Saving..." : "Save changes"}
            </motion.button>
          </form>
        </div>
        )}

        {activeSection === "account" && (
          <div className="settings-card rounded-2xl border border-white/10 overflow-hidden card-glow">
            <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-white/[0.02]">
              <h2 className="text-lg font-bold text-[var(--brand-white)]">{t("account")}</h2>
              <Link href="/dashboard" className="text-sm text-[var(--brand-blue)] hover:underline">{t("backToDashboard")}</Link>
            </div>
            <div className="p-6">
              <p className="text-sm text-neutral-400">{t("accountEmail")}: {user?.email}</p>
              <p className="text-sm text-neutral-400 mt-2">{t("accountRole")}: {user?.role}</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
