"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, ImageIcon, Loader2, MapPin, Map, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { getCart, listAddresses, createCheckoutSession, type CartItem, type Address, type ShippingAddressInput } from "@/lib/api";

const AddressMapPicker = dynamic(
  () => import("@/components/AddressMapPicker").then((m) => m.AddressMapPicker),
  { ssr: false }
);

export default function CheckoutPage() {
  const router = useRouter();
  const t = useTranslations("checkout");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [form, setForm] = useState<ShippingAddressInput>({
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    phone: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [urgent, setUrgent] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [cartRes, addrs] = await Promise.all([getCart(), listAddresses()]);
    setCartItems(cartRes.items);
    setCartTotal(cartRes.total);
    setAddresses(addrs);
    const defaultAddr = addrs.find((a) => a.isDefault) ?? addrs[0];
    if (defaultAddr) setSelectedAddressId(defaultAddr.id);
    else setUseNewAddress(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getShippingAddress = (): ShippingAddressInput | undefined => {
    if (useNewAddress) {
      if (!form.line1.trim() || !form.city.trim() || !form.country.trim()) return undefined;
      return {
        line1: form.line1.trim(),
        line2: form.line2?.trim() || undefined,
        city: form.city.trim(),
        state: form.state?.trim() || undefined,
        zip: form.zip?.trim() || undefined,
        country: form.country.trim(),
        phone: form.phone?.trim() || undefined,
      };
    }
    const addr = addresses.find((a) => a.id === selectedAddressId);
    if (!addr) return undefined;
    return {
      line1: addr.line1,
      line2: addr.line2,
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
      country: addr.country,
      phone: addr.phone,
    };
  };

  const handleSubmit = async () => {
    if (cartItems.length === 0) {
      setError(t("cartEmpty"));
      return;
    }
    const shipping = getShippingAddress();
    if (!shipping) {
      setError(t("addressRequired"));
      return;
    }
    setError(null);
    setSubmitting(true);
    const { url, error: err } = await createCheckoutSession(shipping, urgent);
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    if (url) window.location.href = url;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 text-[var(--brand-blue)] animate-spin" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl bg-white/[0.04] p-12 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
      >
        <p className="text-[var(--brand-white)] font-medium mb-2">{t("cartEmpty")}</p>
        <p className="text-sm text-neutral-400 mb-6">{t("cartEmptyHint")}</p>
        <Link href="/dashboard/cart" className="text-[var(--brand-blue)] hover:underline">
          {t("backToCart")}
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-[var(--brand-white)]">{t("title")}</h1>

      <div className="grid gap-8 lg:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
        >
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--brand-white)] mb-4">
            <MapPin className="w-5 h-5 text-[var(--brand-blue)]" />
            {t("shippingAddress")}
          </h2>
          {addresses.length > 0 && !useNewAddress && (
            <div className="space-y-2 mb-4">
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className={`flex items-start gap-3 rounded-xl p-3 border cursor-pointer transition-colors ${
                    selectedAddressId === addr.id
                      ? "border-[var(--brand-blue)] bg-[var(--brand-blue)]/10"
                      : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={selectedAddressId === addr.id}
                    onChange={() => setSelectedAddressId(addr.id)}
                    className="mt-1"
                  />
                  <div className="text-sm">
                    <p className="font-medium text-[var(--brand-white)]">{addr.line1}</p>
                    {addr.line2 && <p className="text-neutral-400">{addr.line2}</p>}
                    <p className="text-neutral-400">{addr.city}, {addr.state && `${addr.state} `}{addr.zip} {addr.country}</p>
                  </div>
                </label>
              ))}
              <button
                type="button"
                onClick={() => setUseNewAddress(true)}
                className="text-sm text-[var(--brand-blue)] hover:underline"
              >
                {t("useNewAddress")}
              </button>
            </div>
          )}
          {(useNewAddress || addresses.length === 0) && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowMap((v) => !v)}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--brand-blue)]/50 bg-[var(--brand-blue)]/10 px-4 py-2.5 text-sm font-medium text-[var(--brand-blue)] hover:bg-[var(--brand-blue)]/20 transition-colors"
              >
                <Map className="w-4 h-4" />
                {t("chooseOnMap")}
              </button>
              <AnimatePresence>
                {showMap && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <AddressMapPicker
                      hint={t("mapHint")}
                      searchLabel={t("mapSearchLabel")}
                      searchPlaceholder={t("mapSearchPlaceholder")}
                      searchButtonText={t("mapSearchButton")}
                      onAddress={(addr) => {
                        setForm((f) => ({
                          ...f,
                          line1: addr.line1,
                          line2: addr.line2 ?? "",
                          city: addr.city,
                          state: addr.state ?? "",
                          zip: addr.zip ?? "",
                          country: addr.country,
                        }));
                      }}
                      className="mt-2"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <input
                type="text"
                placeholder={t("addressLine1")}
                value={form.line1}
                onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
                className="w-full rounded-xl bg-white/[0.06] border border-white/10 px-4 py-2.5 text-[var(--brand-white)] placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-[var(--brand-blue)]/50"
              />
              <input
                type="text"
                placeholder={t("addressLine2")}
                value={form.line2}
                onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))}
                className="w-full rounded-xl bg-white/[0.06] border border-white/10 px-4 py-2.5 text-[var(--brand-white)] placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-[var(--brand-blue)]/50"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder={t("city")}
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  className="w-full rounded-xl bg-white/[0.06] border border-white/10 px-4 py-2.5 text-[var(--brand-white)] placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-[var(--brand-blue)]/50"
                />
                <input
                  type="text"
                  placeholder={t("state")}
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                  className="w-full rounded-xl bg-white/[0.06] border border-white/10 px-4 py-2.5 text-[var(--brand-white)] placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-[var(--brand-blue)]/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder={t("zip")}
                  value={form.zip}
                  onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
                  className="w-full rounded-xl bg-white/[0.06] border border-white/10 px-4 py-2.5 text-[var(--brand-white)] placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-[var(--brand-blue)]/50"
                />
                <input
                  type="text"
                  placeholder={t("country")}
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  className="w-full rounded-xl bg-white/[0.06] border border-white/10 px-4 py-2.5 text-[var(--brand-white)] placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-[var(--brand-blue)]/50"
                />
              </div>
              <input
                type="text"
                placeholder={t("phone")}
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-xl bg-white/[0.06] border border-white/10 px-4 py-2.5 text-[var(--brand-white)] placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-[var(--brand-blue)]/50"
              />
              {addresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setUseNewAddress(false)}
                  className="text-sm text-[var(--brand-blue)] hover:underline"
                >
                  {t("useSavedAddress")}
                </button>
              )}
            </div>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
        >
          <h2 className="text-lg font-semibold text-[var(--brand-white)] mb-4">{t("orderSummary")}</h2>
          <ul className="space-y-3 mb-6">
            {cartItems.map((item) => (
              <li key={item.productId} className="flex gap-3">
                <div className="relative w-14 h-14 rounded-lg bg-white/5 overflow-hidden shrink-0">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="56px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-neutral-500">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--brand-white)] truncate">{item.name}</p>
                  <p className="text-xs text-neutral-400">Qty: {item.quantity} · ${item.subtotal.toFixed(2)}</p>
                </div>
              </li>
            ))}
          </ul>
          <label className="flex items-center gap-2 cursor-pointer mt-4 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
            <input
              type="checkbox"
              checked={urgent}
              onChange={(e) => setUrgent(e.target.checked)}
              className="rounded border-amber-500/50 text-amber-500 focus:ring-amber-500/50"
            />
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-[var(--brand-white)]">{t("urgentDelivery")}</span>
          </label>
          <div className="border-t border-white/10 pt-4 flex justify-between text-[var(--brand-white)] font-semibold">
            <span>{t("total")}</span>
            <span className="text-[var(--brand-blue)]">${cartTotal.toFixed(2)}</span>
          </div>
          {error && <p className="mt-3 text-sm text-[var(--brand-red)]">{error}</p>}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !getShippingAddress()}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-blue)] py-3 text-sm font-semibold text-white hover:bg-[var(--brand-blue)]/90 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("redirecting")}
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                {t("payWithStripe")}
              </>
            )}
          </button>
          <Link href="/dashboard/cart" className="mt-3 block text-center text-sm text-neutral-400 hover:text-[var(--brand-white)]">
            {t("backToCart")}
          </Link>
        </motion.section>
      </div>
    </div>
  );
}
