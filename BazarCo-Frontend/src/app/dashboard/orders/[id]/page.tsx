"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, MapPin, MessageCircle, UserCircle, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { getOrderById, updateOrderStatus, createConversationByOrder, type Order } from "@/lib/api";

const statusLabelKeys: Record<string, string> = {
  pending: "statusPending",
  paid: "statusPaid",
  in_progress: "statusInProgress",
  completed: "statusCompleted",
  cancelled: "statusCancelled",
};

function StatusBadge({ status, label }: { status: string; label: string }) {
  const styles: Record<string, string> = {
    pending: "bg-neutral-500/20 text-neutral-300 border-neutral-500/40",
    paid: "bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] border-[var(--brand-blue)]/40",
    in_progress: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    cancelled: "bg-[var(--brand-red)]/20 text-[var(--brand-red)] border-[var(--brand-red)]/40",
  };
  const s = styles[status] ?? styles.pending;
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-sm font-medium ${s}`}>
      {label}
    </span>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function OrderDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { user } = useAuth();
  const t = useTranslations("orders");
  const isSeller = user?.role === "seller";
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    getOrderById(id).then((o) => {
      setOrder(o ?? null);
      setLoading(false);
    });
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!order || !isSeller) return;
    setUpdating(true);
    const ok = await updateOrderStatus(order.id, newStatus);
    setUpdating(false);
    if (ok) setOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
  };

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
        <Loader2 className="w-8 h-8 text-[var(--brand-blue)] animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-2xl bg-white/[0.04] p-12 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
        <p className="text-[var(--brand-white)] font-medium mb-2">{t("orderNotFound")}</p>
        <Link href="/dashboard/orders" className="text-[var(--brand-blue)] hover:underline text-sm">
          {t("backToOrders")}
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-[var(--brand-white)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("backToOrders")}
      </Link>

      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
        <div className="px-6 py-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-neutral-500 mb-0.5">Order #{order.id.slice(-8)}</p>
            <p className="text-lg font-semibold text-[var(--brand-white)]">{formatDate(order.createdAt)}</p>
            {order.urgent && (
              <span className="inline-flex items-center gap-1 mt-2 rounded-full border border-amber-500/40 bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                <Zap className="w-3.5 h-3.5" />
                {t("urgent")}
              </span>
            )}
          </div>
          <StatusBadge status={order.status} label={t(statusLabelKeys[order.status] ?? "statusPending")} />
        </div>

        <div className="px-6 py-3 bg-white/[0.02] border-b border-white/10">
          <button
            type="button"
            onClick={handleMessage}
            disabled={startingChat}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--brand-blue)]/40 bg-[var(--brand-blue)]/10 px-4 py-2 text-sm font-medium text-[var(--brand-blue)] hover:bg-[var(--brand-blue)]/20 disabled:opacity-50"
          >
            {startingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
            {isSeller ? t("messageBuyer") : t("messageSeller")}
          </button>
        </div>

        {order.rider && (
          <div className="px-6 py-3 bg-white/[0.02] border-b border-white/10 flex items-center gap-3">
            <UserCircle className="w-5 h-5 text-emerald-500/80" />
            <div>
              <p className="text-xs text-neutral-500">{t("rider")}</p>
              <p className="text-sm font-medium text-[var(--brand-white)]">{order.rider.name}</p>
              {order.rider.phone && <p className="text-xs text-neutral-400">{order.rider.phone}</p>}
            </div>
          </div>
        )}

        {isSeller && ["paid", "in_progress"].includes(order.status) && (
          <div className="px-6 py-4 bg-white/[0.02] border-b border-white/10 flex flex-wrap items-center gap-3">
            <span className="text-sm text-neutral-400">{t("updateStatus")}</span>
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updating}
              className="rounded-xl bg-white/[0.08] border border-white/10 px-4 py-2 text-sm text-[var(--brand-white)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/50 disabled:opacity-50"
            >
              <option value="in_progress">{t("statusInProgress")}</option>
              <option value="completed">{t("statusCompleted")}</option>
              <option value="cancelled">{t("statusCancelled")}</option>
            </select>
          </div>
        )}

        <div className="p-6">
          <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-500 mb-3">Items</h3>
          <ul className="space-y-3 mb-6">
            {order.items.map((item, idx) => (
              <li key={idx} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                <span className="text-[var(--brand-white)]">
                  {item.productName} &times; {item.quantity}
                </span>
                <span className="text-neutral-400 font-medium">${(Number(item.price) * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between items-center py-4 px-4 rounded-xl bg-white/[0.04] border border-white/10">
            <span className="font-semibold text-[var(--brand-white)]">Total</span>
            <span className="text-xl font-bold text-[var(--brand-blue)]">${Number(order.total).toFixed(2)}</span>
          </div>

          {order.shippingAddress && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-neutral-500 mb-3">
                <MapPin className="w-4 h-4 text-[var(--brand-blue)]/80" />
                {t("shipping")}
              </h3>
              <div className="rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3 text-sm text-[var(--brand-white)] leading-relaxed">
                {order.shippingAddress.line1}
                {order.shippingAddress.line2 && `, ${order.shippingAddress.line2}`}
                <br />
                {order.shippingAddress.city}
                {order.shippingAddress.state && `, ${order.shippingAddress.state}`}
                {order.shippingAddress.zip && ` ${order.shippingAddress.zip}`}
                <br />
                {order.shippingAddress.country}
                {order.shippingAddress.phone && (
                  <>
                    <br />
                    <span className="text-neutral-400">{order.shippingAddress.phone}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
