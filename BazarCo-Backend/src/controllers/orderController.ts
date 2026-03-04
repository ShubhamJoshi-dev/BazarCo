import type { Request, Response } from "express";
import { errorResponse, successResponse } from "../helpers/response.helper";
import * as orderRepo from "../repositories/order.repository";
import * as productRepo from "../repositories/product.repository";
import { createShopifyOrder, isShopifyConfigured } from "../services/shopify.service";
import { Order } from "../models/order.model";
import { ordersRouter } from "../routes/orders";

type ReqWithUser = Request & { user?: { id: string } };

export async function listOrders(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const asSeller = req.query.as === "seller";
  const status = typeof req.query.status === "string" && ["pending", "paid", "in_progress", "completed", "cancelled"].includes(req.query.status)
    ? req.query.status
    : undefined;

  const docs = asSeller
    ? await orderRepo.findBySellerId(user.id, status ? { status } : undefined)
    : await orderRepo.findByBuyerId(user.id, status ? { status } : undefined);

  const orders = docs.map((d) => {
    const doc = d as Record<string, unknown> & { _id: { toString(): string }; buyerId: unknown; sellerId: unknown; items: unknown[]; total: number; status: string; createdAt: Date; shippingAddress?: unknown; riderId?: { _id: { toString(): string }; name: string; phone?: string } | null; urgent?: boolean };
    const rider = doc.riderId;
    return {
      id: doc._id.toString(),
      buyerId: doc.buyerId?.toString?.() ?? doc.buyerId,
      sellerId: doc.sellerId?.toString?.() ?? doc.sellerId,
      items: doc.items ?? [],
      total: doc.total,
      status: doc.status,
      createdAt: doc.createdAt?.toISOString?.(),
      shippingAddress: doc.shippingAddress,
      urgent: !!doc.urgent,
      rider: rider ? { id: rider._id.toString(), name: rider.name, phone: rider.phone } : null,
    };
  });

  successResponse(res, 200, "Orders listed", { orders });
}

export async function createOrder(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }

  const body = req.body as { sellerId?: string; items?: Array<{ productId: string; quantity: number }> };
  const sellerId = typeof body.sellerId === "string" ? body.sellerId.trim() : undefined;
  const itemsRaw = Array.isArray(body.items) ? body.items : undefined;

  if (!sellerId || !itemsRaw?.length) {
    errorResponse(res, 400, "sellerId and items (productId, quantity) are required");
    return;
  }

  let total = 0;
  const items: Array<{ productId: string; productName: string; quantity: number; price: number; variantId: string }> = [];

  for (const row of itemsRaw) {
    const productId = typeof row.productId === "string" ? row.productId.trim() : undefined;
    const quantity = typeof row.quantity === "number" ? Math.max(1, Math.floor(row.quantity)) : 1;
    if (!productId) continue;

    const product = await productRepo.findById(productId);
    if (!product) {
      errorResponse(res, 400, `Product not found: ${productId}`);
      return;
    }

    const doc = product as Record<string, unknown> & { sellerId: { toString(): string }; name: string; price: number; shopifyVariantId?: string };

    if (doc.sellerId?.toString() !== sellerId) {
      errorResponse(res, 400, "Product does not belong to this seller");
      return;
    }

    if (!doc.shopifyVariantId) {
      errorResponse(res, 400, `Product does not have a Shopify variant ID: ${doc.name}`);
      return;
    }

    const price = Number(doc.price) ?? 0;
    total += price * quantity;

    items.push({
      productId,
      productName: doc.name,
      quantity,
      price,
      variantId: doc.shopifyVariantId, // 🔹 needed for Shopify order
    });
  }

  if (items.length === 0) {
    errorResponse(res, 400, "No valid items");
    return;
  }

  // 1️⃣ Create internal order
  const order = await orderRepo.createOrder({
    buyerId: user.id,
    sellerId,
    items,
    total,
  });

  let shopifyOrderId: string | undefined;

  // 2️⃣ Create Shopify order if configured
  if (isShopifyConfigured()) {
    try {
      const shopifyOrder = await createShopifyOrder({
        buyerId: user.id,
        sellerId,
        items: items.map(i => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
          price: i.price,
        })),
        total,
      });

      if (shopifyOrder?.id) {
        shopifyOrderId = shopifyOrder.id;
        // Optionally update internal order with Shopify order ID
        await orderRepo.update((order as any)._id.toString(), { shopifyOrderId });
      }
    } catch (err) {
      errorResponse(res,400,"Failed to create Shopify order:");
    }
  }

  const o = order as Record<string, unknown> & {
    _id: { toString(): string };
    buyerId: unknown;
    sellerId: unknown;
    items: unknown[];
    total: number;
    status: string;
    createdAt: Date;
  };

  successResponse(res, 201, "Order created", {
    order: {
      id: o._id.toString(),
      buyerId: o.buyerId?.toString?.() ?? o.buyerId,
      sellerId: o.sellerId?.toString?.() ?? o.sellerId,
      items: o.items,
      total: o.total,
      status: o.status,
      createdAt: o.createdAt?.toISOString?.(),
      shopifyOrderId, // 🔹 Include Shopify order ID in response
    },
  });
}

  export async function getOrderById(req: ReqWithUser, res: Response): Promise<void> {
    const user = req.user;
    if (!user) {
      errorResponse(res, 401, "Authentication required");
      return;
    }
    const orderId = req.params.id;
    const order = await orderRepo.findById(orderId);
    if (!order) {
      errorResponse(res, 404, "Order not found");
      return;
    }
    const doc = order as Record<string, unknown> & { _id: { toString(): string }; buyerId: unknown; sellerId: unknown; items: unknown[]; total: number; status: string; createdAt: Date; shippingAddress?: unknown; riderId?: { _id: { toString(): string }; name: string; phone?: string } | null; urgent?: boolean };
    const buyerId = doc.buyerId?.toString?.() ?? doc.buyerId;
    const sellerId = doc.sellerId?.toString?.() ?? doc.sellerId;
    if (buyerId !== user.id && sellerId !== user.id) {
      errorResponse(res, 404, "Order not found");
      return;
    }
    const rider = doc.riderId;
    successResponse(res, 200, "Order", {
      order: {
        id: doc._id.toString(),
        buyerId: doc.buyerId?.toString?.() ?? doc.buyerId,
        sellerId: doc.sellerId?.toString?.() ?? doc.sellerId,
        items: doc.items ?? [],
        total: doc.total,
        status: doc.status,
        createdAt: doc.createdAt?.toISOString?.(),
        shippingAddress: doc.shippingAddress,
        urgent: !!doc.urgent,
        rider: rider ? { id: rider._id.toString(), name: rider.name, phone: rider.phone } : null,
      },
    });
  }

  export async function updateOrderStatus(req: ReqWithUser, res: Response): Promise<void> {
    const user = req.user;
    if (!user) {
      errorResponse(res, 401, "Authentication required");
      return;
    }

    const orderId = req.params.id;
    const allowed = ["in_progress", "completed", "cancelled"] as const;
    const status = typeof req.body.status === "string" && allowed.includes(req.body.status as (typeof allowed)[number])
      ? (req.body.status as (typeof allowed)[number])
      : undefined;

    if (!status) {
      errorResponse(res, 400, "Valid status required: in_progress, completed, cancelled");
      return;
    }

    const updated = await orderRepo.updateStatus(orderId, user.id, status);
    if (!updated) {
      errorResponse(res, 404, "Order not found");
      return;
    }

    const doc = updated as Record<string, unknown> & { _id: { toString(): string }; buyerId: unknown; sellerId: unknown; items: unknown[]; total: number; status: string; createdAt: Date; shippingAddress?: unknown; riderId?: { _id: { toString(): string }; name: string; phone?: string } | null; urgent?: boolean };
    const rider = doc.riderId;
    successResponse(res, 200, "Order updated", {
      order: {
        id: doc._id.toString(),
        buyerId: doc.buyerId?.toString?.() ?? doc.buyerId,
        sellerId: doc.sellerId?.toString?.() ?? doc.sellerId,
        items: doc.items,
        total: doc.total,
        status: doc.status,
        createdAt: doc.createdAt?.toISOString?.(),
        shippingAddress: doc.shippingAddress,
        urgent: !!doc.urgent,
        rider: rider ? { id: rider._id.toString(), name: rider.name, phone: rider.phone } : null,
      },
    });
  }
