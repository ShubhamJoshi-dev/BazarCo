"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import {
  CreditCard,
  ImageIcon,
  Loader2,
  Lock,
  Map,
  MapPin,
  Plus,
  Shield,
  Truck,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  getCart,
  listAddresses,
  createCheckoutSession,
  type CartItem,
  type Address,
  type ShippingAddressInput,
} from "@/lib/api";

const AddressMapPicker = dynamic(
  () => import("@/components/AddressMapPicker").then((m) => m.AddressMapPicker),
  { ssr: false },
);

type DeliveryMode = "standard" | "express";
type PaymentTab = "wallet" | "card" | "cod";

const EXPRESS_FEE = 150;
const TAX_RATE = 0.13;

export function CheckoutMarketView() {
  const t = useTranslations("checkout");
  const tMk = useTranslations("buyerCheckout");
  const { formatPrice } = useCurrency();

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
  const [delivery, setDelivery] = useState<DeliveryMode>("standard");
  const [paymentTab, setPaymentTab] = useState<PaymentTab>("card");
  const [promo, setPromo] = useState("");

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

  const shippingFee = delivery === "express" ? EXPRESS_FEE : 0;
  const tax = cartTotal * TAX_RATE;
  const grandTotal = cartTotal + shippingFee + tax;

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
    if (paymentTab === "cod") {
      setError(tMk("codUnavailable"));
      return;
    }
    const shipping = getShippingAddress();
    if (!shipping) {
      setError(t("addressRequired"));
      return;
    }
    setError(null);
    setSubmitting(true);
    const { url, error: err } = await createCheckoutSession(shipping, delivery === "express");
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    if (url) window.location.href = url;
  };

  const selectedAddr = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId),
    [addresses, selectedAddressId],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 text-[var(--brand-red)] animate-spin" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-lg mx-auto rounded-xl border border-neutral-200 bg-white dark:bg-[var(--card-bg)] p-12 text-center shadow-sm">
        <p className="font-bold text-lg mb-2">{t("cartEmpty")}</p>
        <p className="text-sm text-[var(--brand-muted)] mb-6">{t("cartEmptyHint")}</p>
        <Link
          href="/dashboard/cart"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-red)] px-5 py-2.5 text-sm font-semibold text-white"
        >
          {t("backToCart")}
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1100px] mx-auto space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{t("title")}</h1>
          <p className="text-sm text-[var(--brand-muted)] mt-1">{tMk("subtitle")}</p>
        </div>
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 shrink-0">
          <Lock className="h-3.5 w-3.5" />
          {tMk("secureCheckout")}
        </span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Shipping */}
          <section className="rounded-xl border border-neutral-200 bg-white dark:bg-[var(--card-bg)] p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-base font-bold">
                <MapPin className="h-5 w-5 text-[var(--brand-red)]" />
                {t("shippingAddress")}
              </h2>
              {addresses.length > 0 && !useNewAddress && (
                <button
                  type="button"
                  onClick={() => setUseNewAddress(true)}
                  className="text-xs font-bold text-[var(--brand-red)] hover:underline"
                >
                  {tMk("change")}
                </button>
              )}
            </div>

            {addresses.length > 0 && !useNewAddress && (
              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                {addresses.map((addr) => {
                  const selected = selectedAddressId === addr.id;
                  return (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`text-left rounded-xl border-2 p-4 transition-colors ${
                        selected
                          ? "border-[var(--brand-red)] bg-red-50/50 dark:bg-red-950/20"
                          : "border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          {addr.label && (
                            <p className="text-xs font-bold text-[var(--brand-muted)] uppercase mb-1">
                              {addr.label}
                            </p>
                          )}
                          <p className="font-semibold text-sm">{addr.line1}</p>
                          <p className="text-xs text-[var(--brand-muted)] mt-1">
                            {[addr.city, addr.state, addr.zip].filter(Boolean).join(", ")}
                          </p>
                          <p className="text-xs text-[var(--brand-muted)]">{addr.country}</p>
                          {addr.phone && (
                            <p className="text-xs text-[var(--foreground)] mt-1">{addr.phone}</p>
                          )}
                        </div>
                        {selected && (
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-red)] text-white text-xs">
                            ✓
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setUseNewAddress(true)}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 p-6 text-sm font-semibold text-[var(--brand-muted)] hover:border-[var(--brand-red)] hover:text-[var(--brand-red)] transition-colors min-h-[120px]"
                >
                  <Plus className="h-6 w-6" />
                  {tMk("addNewAddress")}
                </button>
              </div>
            )}

            {(useNewAddress || addresses.length === 0) && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowMap((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100"
                >
                  <Map className="h-4 w-4" />
                  {t("chooseOnMap")}
                </button>
                {showMap && (
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
                  />
                )}
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder={t("addressLine1")}
                    value={form.line1}
                    onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
                    className="w-full rounded-lg border border-neutral-200 bg-white dark:bg-[var(--input-bg)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)]/30 sm:col-span-2"
                  />
                  <input
                    type="text"
                    placeholder={t("addressLine2")}
                    value={form.line2}
                    onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))}
                    className="w-full rounded-lg border border-neutral-200 bg-white dark:bg-[var(--input-bg)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)]/30 sm:col-span-2"
                  />
                  <input
                    type="text"
                    placeholder={t("city")}
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full rounded-lg border border-neutral-200 bg-white dark:bg-[var(--input-bg)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)]/30"
                  />
                  <input
                    type="text"
                    placeholder={t("state")}
                    value={form.state}
                    onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                    className="w-full rounded-lg border border-neutral-200 bg-white dark:bg-[var(--input-bg)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)]/30"
                  />
                  <input
                    type="text"
                    placeholder={t("zip")}
                    value={form.zip}
                    onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
                    className="w-full rounded-lg border border-neutral-200 bg-white dark:bg-[var(--input-bg)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)]/30"
                  />
                  <input
                    type="text"
                    placeholder={t("country")}
                    value={form.country}
                    onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                    className="w-full rounded-lg border border-neutral-200 bg-white dark:bg-[var(--input-bg)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)]/30"
                  />
                  <input
                    type="text"
                    placeholder={t("phone")}
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-lg border border-neutral-200 bg-white dark:bg-[var(--input-bg)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)]/30 sm:col-span-2"
                  />
                </div>
                {addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setUseNewAddress(false)}
                    className="text-sm font-semibold text-[var(--brand-red)] hover:underline"
                  >
                    {t("useSavedAddress")}
                  </button>
                )}
              </div>
            )}

            {selectedAddr && !useNewAddress && (
              <p className="text-xs text-[var(--brand-muted)] mt-2 sr-only">
                {selectedAddr.line1}
              </p>
            )}
          </section>

          {/* Delivery */}
          <section className="rounded-xl border border-neutral-200 bg-white dark:bg-[var(--card-bg)] p-5 sm:p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-bold mb-4">
              <Truck className="h-5 w-5 text-[var(--brand-red)]" />
              {tMk("deliveryOptions")}
            </h2>
            <div className="space-y-3">
              {(
                [
                  {
                    id: "standard" as const,
                    title: tMk("standardDelivery"),
                    eta: tMk("standardEta"),
                    fee: formatPrice(0),
                  },
                  {
                    id: "express" as const,
                    title: tMk("expressDelivery"),
                    eta: tMk("expressEta"),
                    fee: formatPrice(EXPRESS_FEE),
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDelivery(opt.id)}
                  className={`w-full flex items-center justify-between gap-4 rounded-xl border-2 px-4 py-3.5 text-left transition-colors ${
                    delivery === opt.id
                      ? "border-[var(--brand-red)] bg-red-50/40"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-sm">{opt.title}</p>
                    <p className="text-xs text-[var(--brand-muted)]">{opt.eta}</p>
                  </div>
                  <span className="text-sm font-bold text-[var(--foreground)]">{opt.fee}</span>
                </button>
              ))}
            </div>
            {delivery === "express" && (
              <p className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                <Zap className="h-3.5 w-3.5 shrink-0" />
                {t("urgentDelivery")}
              </p>
            )}
          </section>

          {/* Payment */}
          <section className="rounded-xl border border-neutral-200 bg-white dark:bg-[var(--card-bg)] p-5 sm:p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-bold mb-4">
              <CreditCard className="h-5 w-5 text-[var(--brand-red)]" />
              {tMk("paymentMethod")}
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {(
                [
                  { id: "wallet" as const, label: tMk("payWallet") },
                  { id: "card" as const, label: tMk("payCard") },
                  { id: "cod" as const, label: tMk("payCod") },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPaymentTab(tab.id)}
                  className={`rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                    paymentTab === tab.id
                      ? "border-sky-500 bg-sky-50 text-sky-800"
                      : "border-neutral-200 text-[var(--brand-muted)] hover:border-neutral-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {paymentTab === "card" && (
              <p className="text-sm text-[var(--brand-muted)] rounded-lg bg-neutral-50 border border-neutral-200 px-4 py-3">
                {tMk("stripeRedirect")}
              </p>
            )}
            {paymentTab === "wallet" && (
              <p className="text-sm text-[var(--brand-muted)] rounded-lg bg-neutral-50 border border-neutral-200 px-4 py-3">
                {tMk("walletRedirect")}
              </p>
            )}
            {paymentTab === "cod" && (
              <p className="text-sm text-amber-800 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                {tMk("codNote")}
              </p>
            )}
          </section>
        </div>

        {/* Summary sidebar */}
        <aside className="lg:sticky lg:top-24 h-fit">
          <div className="rounded-xl border border-neutral-200 bg-white dark:bg-[var(--card-bg)] p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold">{t("orderSummary")}</h2>
            <ul className="space-y-3 max-h-48 overflow-y-auto scrollbar-hide">
              {cartItems.map((item) => (
                <li key={item.productId} className="flex gap-3">
                  <div className="relative h-14 w-14 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="56px" />
                    ) : (
                      <ImageIcon className="absolute inset-0 m-auto h-6 w-6 text-neutral-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{item.name}</p>
                    <p className="text-xs text-[var(--brand-muted)]">
                      ×{item.quantity} · {formatPrice(item.subtotal)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="space-y-2 text-sm border-t border-neutral-200 pt-4">
              <div className="flex justify-between text-[var(--brand-muted)]">
                <span>{tMk("subtotal")}</span>
                <span className="font-medium text-[var(--foreground)]">{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-[var(--brand-muted)]">
                <span>{tMk("shipping")}</span>
                <span className="font-medium text-[var(--foreground)]">{formatPrice(shippingFee)}</span>
              </div>
              <div className="flex justify-between text-[var(--brand-muted)]">
                <span>{tMk("tax")}</span>
                <span className="font-medium text-[var(--foreground)]">{formatPrice(tax)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={promo}
                onChange={(e) => setPromo(e.target.value)}
                placeholder={tMk("promoPlaceholder")}
                className="w-full rounded-lg border border-neutral-200 bg-white dark:bg-[var(--input-bg)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)]/30 flex-1 text-sm"
              />
              <button
                type="button"
                className="shrink-0 rounded-lg border border-neutral-300 px-3 py-2 text-xs font-bold hover:bg-neutral-50"
              >
                {tMk("apply")}
              </button>
            </div>

            <div className="flex justify-between items-baseline border-t border-neutral-200 pt-4">
              <span className="font-bold">{t("total")}</span>
              <span className="text-2xl font-black text-[var(--brand-red)]">{formatPrice(grandTotal)}</span>
            </div>

            {error && <p className="text-sm text-[var(--brand-red)]">{error}</p>}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !getShippingAddress()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-red)] py-3.5 text-sm font-bold text-white hover:bg-[#b71c1c] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("redirecting")}
                </>
              ) : (
                tMk("placeOrder")
              )}
            </button>

            <Link
              href="/dashboard/cart"
              className="block text-center text-sm text-[var(--brand-muted)] hover:text-[var(--foreground)]"
            >
              {t("backToCart")}
            </Link>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-100">
              {[tMk("trustSsl"), tMk("trustSecure"), tMk("trustAuth")].map((label) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1 text-center text-[9px] font-bold text-[var(--brand-muted)] uppercase"
                >
                  <Shield className="h-4 w-4 text-emerald-600" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
