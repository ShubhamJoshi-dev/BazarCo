"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  BadgeCheck,
  CreditCard,
  HandCoins,
  Heart,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Shield,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  favouritesList,
  listAddresses,
  listOffers,
  listOrders,
  type Address,
  type Order,
} from "@/lib/api";

function getInitial(name?: string | null, email?: string | null) {
  if (name?.trim()) return name.trim().slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return "BU";
}

function pseudoPoints(userId: string) {
  let h = 0;
  for (const ch of userId) h = (h * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return 8000 + (Math.abs(h) % 8000);
}

function orderStatusStyle(status: string) {
  const s = status.toLowerCase();
  if (s === "delivered" || s === "completed") return "text-emerald-600 bg-emerald-50";
  if (s === "shipped" || s === "in_transit" || s === "in transit") return "text-amber-700 bg-amber-50";
  return "text-sky-700 bg-sky-50";
}

function orderStatusLabel(status: string, t: (k: string) => string) {
  const s = status.toLowerCase();
  if (s === "delivered" || s === "completed") return t("statusDelivered");
  if (s === "shipped" || s === "in_transit") return t("statusInTransit");
  if (s === "processing" || s === "pending") return t("statusProcessing");
  return t("statusUpdated");
}

export function BuyerProfileMarketView() {
  const t = useTranslations("buyerProfile");
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeBargains, setActiveBargains] = useState(0);
  const [favCount, setFavCount] = useState(0);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      listOrders(),
      listOffers({ asSeller: false }),
      favouritesList(),
      listAddresses(),
    ]).then(([orderList, offers, favs, addrs]) => {
      setOrders(orderList.slice(0, 5));
      setActiveBargains(
        offers.filter((o) => o.status === "pending" || o.status === "countered" || o.status === "accepted").length,
      );
      setFavCount(favs.length);
      setAddresses(addrs);
      setLoading(false);
    });
  }, [user]);

  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || t("guest");
  const location = useMemo(() => {
    const def = addresses.find((a) => a.isDefault) ?? addresses[0];
    if (def) return `${def.city}, ${def.country}`;
    return t("defaultLocation");
  }, [addresses, t]);

  const rewardPoints = user ? pseudoPoints(user.id) : 0;

  if (loading) {
    return (
      <div className="w-full max-w-[1100px] mx-auto space-y-4 animate-pulse">
        <div className="h-40 bg-neutral-100 rounded-2xl" />
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-neutral-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1100px] mx-auto space-y-6">
      {/* Profile hero */}
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="rounded-2xl border border-neutral-200 bg-white dark:bg-[var(--card-bg)] p-6 shadow-sm flex flex-col sm:flex-row gap-6">
          <div className="flex flex-col items-center sm:items-start gap-3">
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--brand-blue)]/15 text-2xl font-black text-[var(--brand-blue)] border-4 border-white shadow-md">
              {getInitial(user?.name, user?.email)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 border border-sky-200 px-3 py-1 text-xs font-semibold text-sky-700">
              <BadgeCheck className="h-3.5 w-3.5" /> {t("verifiedBuyer")}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-[var(--foreground)]">{displayName}</h1>
            <p className="text-sm text-[var(--brand-muted)] mt-1">{user?.email}</p>
            <p className="text-sm text-[var(--brand-muted)] flex items-center gap-1.5 mt-2">
              <MapPin className="h-4 w-4 shrink-0" /> {location}
            </p>
            <Link
              href="/dashboard/settings"
              className="inline-block mt-4 text-sm font-semibold text-[var(--brand-red)] hover:underline"
            >
              {t("editProfile")} →
            </Link>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-[var(--brand-red)] to-[#9f1239] p-6 text-white shadow-lg flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-90">{t("membership")}</p>
            <p className="text-2xl font-black mt-1">{t("goldMember")}</p>
            <p className="text-sm mt-3 opacity-95">
              <span className="text-2xl font-black">{rewardPoints.toLocaleString()}</span>
              <br />
              {t("rewardPoints")}
            </p>
            <p className="text-xs mt-2 opacity-80">{t("level", { level: 4 })}</p>
          </div>
          <button
            type="button"
            className="mt-4 w-full rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur py-2.5 text-sm font-bold border border-white/30"
            onClick={() => alert(t("redeemSoon"))}
          >
            {t("redeemNow")}
          </button>
        </div>
      </div>

      {/* Middle row */}
      <div className="grid gap-4 md:grid-cols-3">
        <ProfileCard title={t("recentOrders")} actionHref="/dashboard/orders" actionLabel={t("viewAll")}>
          {orders.length === 0 ? (
            <p className="text-sm text-[var(--brand-muted)] py-4">{t("noOrders")}</p>
          ) : (
            <ul className="space-y-3">
              {orders.slice(0, 2).map((order) => {
                const item = order.items[0];
                return (
                  <li key={order.id}>
                    <Link href={`/dashboard/orders/${order.id}`} className="flex items-center gap-3 group">
                      <span className="h-12 w-12 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                        <Package className="h-5 w-5 text-neutral-400" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate group-hover:text-[var(--brand-red)]">
                          {item?.productName ?? t("orderItem")}
                        </p>
                        <span
                          className={`inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded ${orderStatusStyle(order.status)}`}
                        >
                          {orderStatusLabel(order.status, t)}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </ProfileCard>

        <ProfileCard title={t("bargains")} actionHref="/dashboard/offers" actionLabel={t("viewBargainHub")}>
          <div className="py-2">
            <p className="text-3xl font-black text-[var(--foreground)]">{activeBargains}</p>
            <p className="text-sm text-[var(--brand-muted)] mt-1">{t("activeNegotiations")}</p>
            <Link
              href="/dashboard/offers"
              className="mt-4 inline-flex items-center justify-center w-full rounded-xl bg-sky-600 text-white py-2.5 text-sm font-semibold hover:bg-sky-700"
            >
              <HandCoins className="h-4 w-4 mr-2" />
              {t("viewBargainHub")}
            </Link>
          </div>
        </ProfileCard>

        <ProfileCard title={t("payments")}>
          <ul className="space-y-3">
            <li className="flex items-center justify-between gap-2 rounded-lg border border-neutral-100 p-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-neutral-500" />
                <span className="text-sm font-medium">{t("visaEnding", { last4: "4421" })}</span>
              </div>
              <span className="text-[10px] text-[var(--brand-muted)]">{t("default")}</span>
            </li>
            <li className="flex items-center justify-between gap-2 rounded-lg border border-neutral-100 p-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-medium">{t("esewaWallet")}</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {t("connected")}
              </span>
            </li>
          </ul>
          <p className="text-[10px] text-[var(--brand-muted)] mt-3">{t("paymentsHint")}</p>
        </ProfileCard>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ProfileCard title={t("addresses")} compact>
          {addresses.length === 0 ? (
            <p className="text-xs text-[var(--brand-muted)]">{t("noAddresses")}</p>
          ) : (
            <div className="text-sm">
              <p className="font-semibold">{addresses[0]?.label ?? t("home")}</p>
              <p className="text-[var(--brand-muted)] text-xs mt-1 line-clamp-2">
                {addresses[0]?.line1}, {addresses[0]?.city}
              </p>
            </div>
          )}
          <Link
            href="/dashboard/settings?tab=account"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-red)] hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> {t("addAddress")}
          </Link>
        </ProfileCard>

        <ProfileCard title={t("savedLists")} compact>
          <div className="space-y-3">
            <Link href="/dashboard/favourites" className="flex items-center gap-2 text-sm font-medium hover:text-[var(--brand-red)]">
              <Heart className="h-4 w-4 text-[var(--brand-red)]" />
              {t("wishlist", { count: favCount })}
            </Link>
            <Link href="/dashboard/orders" className="flex items-center gap-2 text-sm font-medium hover:text-[var(--brand-red)]">
              <RefreshCw className="h-4 w-4 text-neutral-500" />
              {t("buyAgain")}
            </Link>
          </div>
        </ProfileCard>

        <ProfileCard title={t("quickHelp")} compact>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/dashboard/chat" className="text-[var(--brand-muted)] hover:text-[var(--brand-red)]">
                {t("helpReturn")}
              </Link>
            </li>
            <li>
              <Link href="/dashboard/chat" className="text-[var(--brand-muted)] hover:text-[var(--brand-red)]">
                {t("helpSeller")}
              </Link>
            </li>
            <li>
              <Link href="/dashboard/browse" className="text-[var(--brand-muted)] hover:text-[var(--brand-red)]">
                {t("helpShipping")}
              </Link>
            </li>
          </ul>
        </ProfileCard>

        <ProfileCard title={t("security")} compact>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium">{t("twoFactor")}</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {t("on")}
              </span>
            </div>
            <Link
              href="/dashboard/settings?tab=privacy"
              className="text-xs font-semibold text-[var(--brand-red)] hover:underline flex items-center gap-1"
            >
              <Shield className="h-3.5 w-3.5" /> {t("changePassword")}
            </Link>
          </div>
        </ProfileCard>
      </div>
    </div>
  );
}

function ProfileCard({
  title,
  actionHref,
  actionLabel,
  compact,
  children,
}: {
  title: string;
  actionHref?: string;
  actionLabel?: string;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-xl border border-neutral-200 bg-white dark:bg-[var(--card-bg)] shadow-sm ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="text-sm font-bold text-[var(--foreground)]">{title}</h2>
        {actionHref && actionLabel && (
          <Link href={actionHref} className="text-xs font-semibold text-sky-600 hover:underline shrink-0">
            {actionLabel}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
