import type { Types } from "mongoose";
import { Order, type OrderStatus } from "../models/order.model";
import { User } from "../models/user.model";
import { Product } from "../models/product.model";

export interface OrderItemInput {
  productId: string | Types.ObjectId;
  productName: string;
  quantity: number;
  price: number;
}

export interface ShippingAddressInput {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  zip?: string;
  country: string;
  phone?: string;
}

export async function createOrder(data: {
  buyerId: string | Types.ObjectId;
  sellerId: string | Types.ObjectId;
  items: OrderItemInput[];
  total: number;
  status?: import("../models/order.model").OrderStatus;
  stripeSessionId?: string;
  shippingAddress?: ShippingAddressInput;
  riderId?: string | Types.ObjectId;
  urgent?: boolean;
  
}) {
  const doc = await Order.create(data);
  return doc.toObject();
}
export async function update(
  orderId: string | Types.ObjectId,
  data: Partial<{
    buyerId: string | Types.ObjectId;
    sellerId: string | Types.ObjectId;
    items: OrderItemInput[];
    total: number;
    status: OrderStatus;
    stripeSessionId?: string;
    shippingAddress?: ShippingAddressInput;
    riderId?: string | Types.ObjectId;
    urgent?: boolean;
    shopifyOrderId?: string;
  }>
) {
  const updated = await Order.findByIdAndUpdate(
    orderId,
    { $set: data },
    { new: true } // return the updated document
  )
    .populate("riderId", "name phone userId")
    .lean();

  return updated ?? null;
}
export async function findById(id: string) {
  const doc = await Order.findById(id).populate("riderId", "name phone userId").lean();
  return doc ?? null;
}

export async function findBySellerId(sellerId: string, options?: { status?: OrderStatus }) {
  const query: Record<string, unknown> = { sellerId };
  if (options?.status) query.status = options.status;
  const docs = await Order.find(query)
    .populate("buyerId", "name email")
    .populate("riderId", "name phone userId")
    .sort({ createdAt: -1 })
    .lean();
  return docs;
}

export async function findByBuyerId(buyerId: string, options?: { status?: OrderStatus }) {
  const query: Record<string, unknown> = { buyerId };
  if (options?.status) query.status = options.status;
  const docs = await Order.find(query).populate("riderId", "name phone userId").sort({ createdAt: -1 }).lean();
  return docs;
}

export async function updateStatus(orderId: string, sellerId: string, status: OrderStatus) {
  const doc = await Order.findOneAndUpdate(
    { _id: orderId, sellerId },
    { $set: { status } },
    { new: true }
  )
    .populate("riderId", "name phone userId")
    .lean();
  return doc ?? null;
}

export async function getSellerOrderStats(sellerId: string): Promise<{
  completed: Array<{
    id: string;
    buyerId: string;
    total: number;
    status: string;
    createdAt: string;
    items: Array<{ productName: string; quantity: number; price: number }>;
  }>;
  inProgress: Array<{
    id: string;
    buyerId: string;
    total: number;
    status: string;
    createdAt: string;
    items: Array<{ productName: string; quantity: number; price: number }>;
  }>;
  productsSold: Array<{ productName: string; quantity: number; orderId: string }>;
  soldCount: number;
}> {
  const [completedDocs, inProgressDocs] = await Promise.all([
    Order.find({ sellerId, status: "completed" }).sort({ createdAt: -1 }).limit(50).lean(),
    Order.find({ sellerId, status: { $in: ["pending", "paid", "in_progress"] } }).sort({ createdAt: -1 }).limit(50).lean(),
  ]);

  const toDto = (d: Record<string, unknown> & { _id: Types.ObjectId; buyerId: Types.ObjectId; items: Array<{ productName: string; quantity: number; price: number }>; total: number; status: string; createdAt: Date }) => ({
    id: d._id.toString(),
    buyerId: (d.buyerId as Types.ObjectId).toString(),
    total: d.total,
    status: d.status,
    createdAt: (d.createdAt as Date).toISOString(),
    items: (d.items ?? []).map((i) => ({ productName: i.productName, quantity: i.quantity, price: i.price })),
  });

  const completed = completedDocs.map((d) => toDto(d as Parameters<typeof toDto>[0]));
  const inProgress = inProgressDocs.map((d) => toDto(d as Parameters<typeof toDto>[0]));

  const productsSold: Array<{ productName: string; quantity: number; orderId: string }> = [];
  for (const o of completedDocs) {
    const doc = o as { _id: Types.ObjectId; items?: Array<{ productName: string; quantity: number }> };
    for (const item of doc.items ?? []) {
      productsSold.push({
        productName: item.productName,
        quantity: item.quantity,
        orderId: doc._id.toString(),
      });
    }
  }

  const soldCount = productsSold.reduce((sum, i) => sum + i.quantity, 0);

  return { completed, inProgress, productsSold, soldCount };
}
export interface UpdateOrderInput {
  orderId: string;
  status?: string; // e.g., "PAID", "SHIPPED", "CANCELLED"
  items?: Array<{
    productId: string;
    quantity?: number;
    price?: number;
  }>;
  total?: number;
  shopifyOrderId?: string;
}

export interface SellerDashboardOrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  productName: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface SellerDashboardSalesDay {
  day: string;
  label: string;
  amount: number;
}

export interface SellerDashboardAlert {
  id: string;
  type: "low_stock" | "return" | "dispatch" | "kyc";
  title: string;
  description: string;
  severity: "urgent" | "warning" | "info";
}

export interface SellerDashboardData {
  metrics: {
    totalRevenue: number;
    revenueChangePercent: number;
    revenueTarget: number;
    revenueTargetPercent: number;
    activeOrders: number;
    pendingDispatch: number;
    outOfStock: number;
  };
  salesByDay: SellerDashboardSalesDay[];
  recentOrders: SellerDashboardOrderRow[];
  alerts: SellerDashboardAlert[];
}

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function orderNumberFromId(id: string): string {
  const tail = id.replace(/[^a-f0-9]/gi, "").slice(-4).toUpperCase() || "0000";
  return `#ORD-${tail}`;
}

export async function getSellerDashboardData(
  sellerId: string,
  options?: { days?: number }
): Promise<SellerDashboardData> {
  const days = Math.min(Math.max(options?.days ?? 30, 7), 90);
  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - days);
  const prevPeriodStart = new Date(periodStart);
  prevPeriodStart.setDate(prevPeriodStart.getDate() - days);

  const weekStart = startOfDay(new Date(now));
  weekStart.setDate(weekStart.getDate() - 6);

  const [
    completedInPeriod,
    completedInPrevPeriod,
    activeOrderCount,
    pendingDispatchCount,
    archivedProductCount,
    recentOrderDocs,
    weekOrderDocs,
    recentCancelled,
    archivedProducts,
    sellerUser,
  ] = await Promise.all([
    Order.find({
      sellerId,
      status: "completed",
      createdAt: { $gte: periodStart },
    })
      .select("total createdAt")
      .lean(),
    Order.find({
      sellerId,
      status: "completed",
      createdAt: { $gte: prevPeriodStart, $lt: periodStart },
    })
      .select("total")
      .lean(),
    Order.countDocuments({
      sellerId,
      status: { $in: ["pending", "paid", "in_progress"] },
    }),
    Order.countDocuments({
      sellerId,
      status: { $in: ["paid", "in_progress"] },
    }),
    Product.countDocuments({ sellerId, status: "archived" }),
    Order.find({ sellerId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("buyerId", "name email")
      .lean(),
    Order.find({
      sellerId,
      status: "completed",
      createdAt: { $gte: weekStart },
    })
      .select("total createdAt")
      .lean(),
    Order.find({
      sellerId,
      status: "cancelled",
      createdAt: { $gte: periodStart },
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean(),
    Product.find({ sellerId, status: "archived" })
      .sort({ updatedAt: -1 })
      .limit(3)
      .select("name")
      .lean(),
    User.findById(sellerId).select("kycVerified").lean(),
  ]);

  const totalRevenue = completedInPeriod.reduce(
    (sum, o) => sum + ((o as { total: number }).total ?? 0),
    0
  );
  const prevRevenue = completedInPrevPeriod.reduce(
    (sum, o) => sum + ((o as { total: number }).total ?? 0),
    0
  );
  let revenueChangePercent = 0;
  if (prevRevenue > 0) {
    revenueChangePercent = Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 1000) / 10;
  } else if (totalRevenue > 0) {
    revenueChangePercent = 100;
  }

  const revenueTarget = Math.max(prevRevenue * 1.2, totalRevenue * 1.15, 1000);
  const revenueTargetPercent = Math.min(
    100,
    Math.round((totalRevenue / revenueTarget) * 1000) / 10
  );

  const salesByDayMap = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    salesByDayMap.set(key, 0);
  }
  for (const o of weekOrderDocs) {
    const doc = o as { total: number; createdAt: Date };
    const key = startOfDay(new Date(doc.createdAt)).toISOString().slice(0, 10);
    if (salesByDayMap.has(key)) {
      salesByDayMap.set(key, (salesByDayMap.get(key) ?? 0) + doc.total);
    }
  }
  const salesByDay: SellerDashboardSalesDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    salesByDay.push({
      day: key,
      label: DAY_LABELS[d.getDay()],
      amount: salesByDayMap.get(key) ?? 0,
    });
  }

  const recentOrders: SellerDashboardOrderRow[] = recentOrderDocs.map((raw) => {
    const doc = raw as Record<string, unknown> & {
      _id: Types.ObjectId;
      buyerId?: { name?: string; email?: string } | Types.ObjectId;
      items?: Array<{ productName: string }>;
      total: number;
      status: string;
      createdAt: Date;
    };
    const id = doc._id.toString();
    const buyer =
      doc.buyerId && typeof doc.buyerId === "object" && "name" in doc.buyerId
        ? doc.buyerId
        : null;
    const customerName =
      buyer?.name?.trim() || buyer?.email?.split("@")[0] || "Customer";
    const items = doc.items ?? [];
    const productName =
      items.length === 0
        ? "—"
        : items.length === 1
          ? items[0].productName
          : `${items[0].productName} +${items.length - 1} more`;
    return {
      id,
      orderNumber: orderNumberFromId(id),
      customerName,
      productName,
      amount: doc.total,
      status: doc.status,
      createdAt: doc.createdAt.toISOString(),
    };
  });

  const alerts: SellerDashboardAlert[] = [];

  for (const p of archivedProducts) {
    const name = (p as { name: string }).name;
    alerts.push({
      id: `archived-${(p as { _id: Types.ObjectId })._id.toString()}`,
      type: "low_stock",
      title: "Archived listing",
      description: `${name} is archived — restock or relist`,
      severity: "urgent",
    });
  }

  for (const o of recentCancelled) {
    const doc = o as { _id: Types.ObjectId };
    alerts.push({
      id: `cancel-${doc._id.toString()}`,
      type: "return",
      title: "Cancelled order",
      description: `${orderNumberFromId(doc._id.toString())} was cancelled`,
      severity: "warning",
    });
  }

  if (pendingDispatchCount > 0) {
    alerts.push({
      id: "dispatch-pending",
      type: "dispatch",
      title: "Pending dispatch",
      description: `${pendingDispatchCount} order(s) awaiting shipment`,
      severity: pendingDispatchCount >= 5 ? "urgent" : "warning",
    });
  }

  const kycVerified = (sellerUser as { kycVerified?: boolean } | null)?.kycVerified ?? false;
  if (!kycVerified) {
    alerts.push({
      id: "kyc-pending",
      type: "kyc",
      title: "Complete KYC",
      description: "Verify your seller account to list new products",
      severity: "info",
    });
  }

  return {
    metrics: {
      totalRevenue,
      revenueChangePercent,
      revenueTarget,
      revenueTargetPercent,
      activeOrders: activeOrderCount,
      pendingDispatch: pendingDispatchCount,
      outOfStock: archivedProductCount,
    },
    salesByDay,
    recentOrders,
    alerts: alerts.slice(0, 6),
  };
}
