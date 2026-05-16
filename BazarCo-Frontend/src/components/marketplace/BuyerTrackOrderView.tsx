"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  HelpCircle,
  ImageIcon,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  RotateCcw,
  Truck,
  UserCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { createConversationByOrder, getOrderById, type Order } from "@/lib/api";
import { useCurrency } from "@/contexts/CurrencyContext";

const TIMELINE = [
  { key: "pending", step: 0 },
  { key: "paid", step: 1 },
  { key: "in_progress", step: 2 },
  { key: "completed", step: 3 },
] as const;

const STEP_LABELS = ["stepPlaced", "stepPacked", "stepOutForDelivery", "stepDelivered"] as const;

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function pseudoArrivalTime(createdAt: string): string {
  const d = new Date(createdAt);
  d.setHours(d.getHours() + 5);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function currentStepIndex(status: string): number {
  if (status === "cancelled") return -1;
  const found = TIMELINE.find((t) => t.key === status);
  return found?.step ?? 0;
}

export function BuyerTrackOrderView({ orderId }: { orderId: string }) {
  const router = useRouter();
  const t = useTranslations("buyerTrackOrder");
  const tOrders = useTranslations("orders");
  const { formatPrice } = useCurrency();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    getOrderById(orderId).then((o) => {
      setOrder(o ?? null);
      setLoading(false);
    });
  }, [orderId]);

  const handleMessage = async () => {
    if (!order?.id) return;
    setStartingChat(true);
    const conv = await createConversationByOrder(order.id);
    setStartingChat(false);
    if (conv) router.push(`/dashboard/chat/${conv.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 text-[var(--brand-red)] animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-lg mx-auto rounded-xl border border-neutral-200 bg-white dark:bg-[var(--card-bg)] p-12 text-center">
        <Package className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
        <p className="font-bold text-lg mb-2">{tOrders("orderNotFound")}</p>
        <Link href="/dashboard/orders" className="text-sm font-bold text-[var(--brand-red)] hover:underline">
          {tOrders("backToOrders")}
        </Link>
      </div>
    );
  }

  const stepIdx = currentStepIndex(order.status);
  const isCancelled = order.status === "cancelled";
  const displayId = order.orderNumber ?? `#${order.id.slice(-8).toUpperCase()}`;

  return (
    <div className="w-full max-w-[1100px] mx-auto space-y-6 pb-10">
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-muted)] hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        {tOrders("backToOrders")}
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[var(--brand-muted)] uppercase tracking-wide">{t("trackOrder")}</p>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">{displayId}</h1>
          <p className="text-sm text-[var(--brand-muted)] mt-1">
            {formatDateTime(order.createdAt)} · {t("itemCount", { count: order.items.length })} ·{" "}
            <span className="font-bold text-[var(--foreground)]">{formatPrice(Number(order.total))}</span>
          </p>
        </div>
        {!isCancelled && order.status !== "completed" && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-center shrink-0">
            <p className="text-[10px] font-bold uppercase text-emerald-700">{t("arrivingBy")}</p>
            <p className="text-lg font-black text-emerald-800">{pseudoArrivalTime(order.createdAt)}</p>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* Map placeholder */}
          {!isCancelled && (
            <section className="rounded-xl border border-neutral-200 overflow-hidden bg-white dark:bg-[var(--card-bg)] shadow-sm">
              <div className="relative h-56 sm:h-72 bg-gradient-to-br from-emerald-100 via-sky-100 to-blue-200">
                <span className="absolute top-3 left-3 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase px-2.5 py-1 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  {t("liveTracking")}
                </span>
                {order.rider && (
                  <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-xs rounded-xl bg-white shadow-lg border border-neutral-200 p-3 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <UserCircle className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-[var(--brand-muted)] uppercase">{t("yourRider")}</p>
                      <p className="font-bold text-sm truncate">{order.rider.name}</p>
                    </div>
                    {order.rider.phone && (
                      <a
                        href={`tel:${order.rider.phone}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-red)] text-white shrink-0"
                        aria-label={t("callRider")}
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 rounded-full bg-[var(--brand-red)] border-2 border-white shadow-lg" />
                </div>
              </div>
            </section>
          )}

          {/* Package contents */}
          <section className="rounded-xl border border-neutral-200 bg-white dark:bg-[var(--card-bg)] p-5 shadow-sm">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-[var(--brand-red)]" />
              {t("packageContents")}
            </h2>
            <ul className="space-y-4 list-none">
              {order.items.map((item, idx) => (
                <li key={idx} className="flex gap-4 items-center">
                  <div className="relative h-16 w-16 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0">
                    <ImageIcon className="absolute inset-0 m-auto h-6 w-6 text-neutral-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm line-clamp-2">{item.productName}</p>
                    <p className="text-xs text-[var(--brand-muted)] mt-0.5">
                      {formatPrice(Number(item.price))} × {item.quantity}
                    </p>
                  </div>
                  {item.productId && (
                    <Link
                      href={`/dashboard/product/${item.productId}`}
                      className="text-xs font-bold text-sky-600 hover:underline shrink-0"
                    >
                      {t("viewProduct")}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleMessage}
              disabled={startingChat}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-50"
            >
              {startingChat ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
              {tOrders("messageSeller")}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-24 h-fit">
          {/* Timeline */}
          <section className="rounded-xl border border-neutral-200 bg-white dark:bg-[var(--card-bg)] p-5 shadow-sm">
            <h2 className="text-sm font-bold mb-4">{t("orderStatus")}</h2>
            {isCancelled ? (
              <p className="text-sm font-semibold text-[var(--brand-red)]">{tOrders("statusCancelled")}</p>
            ) : (
              <ol className="space-y-0 list-none">
                {STEP_LABELS.map((labelKey, i) => {
                  const done = i <= stepIdx;
                  const current = i === stepIdx && order.status !== "completed";
                  return (
                    <li key={labelKey} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold ${
                            done
                              ? current
                                ? "border-[var(--brand-red)] bg-[var(--brand-red)] text-white"
                                : "border-emerald-500 bg-emerald-500 text-white"
                              : "border-neutral-200 bg-neutral-50 text-neutral-400"
                          }`}
                        >
                          {done && !current ? <Check className="h-4 w-4" /> : i + 1}
                        </span>
                        {i < STEP_LABELS.length - 1 && (
                          <span
                            className={`w-0.5 flex-1 min-h-[24px] my-1 ${
                              i < stepIdx ? "bg-emerald-400" : "bg-neutral-200"
                            }`}
                          />
                        )}
                      </div>
                      <div className="pb-5 min-w-0">
                        <p
                          className={`text-sm font-bold ${
                            done ? "text-[var(--foreground)]" : "text-[var(--brand-muted)]"
                          }`}
                        >
                          {t(labelKey)}
                        </p>
                        {done && (
                          <p className="text-xs text-[var(--brand-muted)] mt-0.5">
                            {formatDateTime(order.createdAt)}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          {order.shippingAddress && (
            <section className="rounded-xl border border-neutral-200 bg-white dark:bg-[var(--card-bg)] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold">{tOrders("shipping")}</h2>
                <Link href="/dashboard/profile" className="text-xs font-bold text-[var(--brand-red)] hover:underline">
                  {t("change")}
                </Link>
              </div>
              <p className="text-sm text-[var(--brand-muted)] leading-relaxed">
                {order.shippingAddress.line1}
                {order.shippingAddress.line2 && <>, {order.shippingAddress.line2}</>}
                <br />
                {[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.zip]
                  .filter(Boolean)
                  .join(", ")}
                <br />
                {order.shippingAddress.country}
              </p>
            </section>
          )}

          <section className="rounded-xl border border-neutral-200 bg-white dark:bg-[var(--card-bg)] p-5 shadow-sm space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--brand-muted)]">{t("subtotal")}</span>
              <span className="font-semibold">{formatPrice(Number(order.total))}</span>
            </div>
            <div className="flex justify-between border-t border-neutral-200 pt-2">
              <span className="font-bold">{t("totalPaid")}</span>
              <span className="text-lg font-black text-[var(--brand-red)]">
                {formatPrice(Number(order.total))}
              </span>
            </div>
            <p className="text-xs text-[var(--brand-muted)]">{t("paidViaStripe")}</p>
          </section>
        </aside>
      </div>

      {/* Utility bar */}
      <div className="grid sm:grid-cols-3 gap-3 rounded-xl border border-neutral-200 bg-neutral-50/80 dark:bg-neutral-900/20 p-4">
        {[
          { icon: HelpCircle, label: t("needHelp") },
          { icon: RotateCcw, label: t("returnPolicy") },
          { icon: MessageCircle, label: t("liveSupport") },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            type="button"
            className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold text-[var(--brand-muted)] hover:text-[var(--foreground)] hover:bg-white transition-colors"
          >
            <Icon className="h-4 w-4 text-[var(--brand-red)]" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
