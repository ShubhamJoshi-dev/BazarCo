import type { Types } from "mongoose";
import { Order, type OrderStatus } from "../models/order.model";

export interface OrderItemInput {
  productId: string | Types.ObjectId;
  productName: string;
  quantity: number;
  price: number;
}

export async function createOrder(data: {
  buyerId: string | Types.ObjectId;
  sellerId: string | Types.ObjectId;
  items: OrderItemInput[];
  total: number;
}) {
  const doc = await Order.create(data);
  return doc.toObject();
}

export async function findById(id: string) {
  const doc = await Order.findById(id).lean();
  return doc ?? null;
}

export async function findBySellerId(sellerId: string, options?: { status?: OrderStatus }) {
  const query: Record<string, unknown> = { sellerId };
  if (options?.status) query.status = options.status;
  const docs = await Order.find(query).sort({ createdAt: -1 }).lean();
  return docs;
}

export async function findByBuyerId(buyerId: string, options?: { status?: OrderStatus }) {
  const query: Record<string, unknown> = { buyerId };
  if (options?.status) query.status = options.status;
  const docs = await Order.find(query).sort({ createdAt: -1 }).lean();
  return docs;
}

export async function updateStatus(orderId: string, sellerId: string, status: OrderStatus) {
  const doc = await Order.findOneAndUpdate(
    { _id: orderId, sellerId },
    { $set: { status } },
    { new: true }
  ).lean();
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
    Order.find({ sellerId, status: { $in: ["pending", "in_progress"] } }).sort({ createdAt: -1 }).limit(50).lean(),
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
