import type { Request, Response } from "express";
import { Types } from "mongoose";
import Stripe from "stripe";
import { errorResponse, successResponse } from "../helpers/response.helper";
import { env } from "../config/env";
import * as cartRepo from "../repositories/cart.repository";
import * as productRepo from "../repositories/product.repository";
import * as orderRepo from "../repositories/order.repository";
import * as riderRepo from "../repositories/rider.repository";
import { createShopifyDraftOrder, completeShopifyDraftOrder } from "../services/shopify.service";
import { emailHelper } from "../helpers/email.helper";

type ReqWithUser = Request & { user?: { id: string } };

function getStripeClient(): Stripe | null {
  if (!env.STRIPE_SECRET_KEY) return null;
  return new Stripe(env.STRIPE_SECRET_KEY);
}

/** Get cart with product details (name, price, imageUrl, sellerId) for current user */
async function getCartWithDetails(userId: string): Promise<Array<{
  productId: string;
  quantity: number;
  name: string;
  price: number;
  imageUrl?: string;
  sellerId: string;
}>> {
  const cart = await cartRepo.getCart(userId);
  const doc = cart as { items?: Array<{ productId: Types.ObjectId; quantity: number }> } | null;
  if (!doc?.items?.length) return [];
  const out: Array<{ productId: string; quantity: number; name: string; price: number; imageUrl?: string; sellerId: string }> = [];
  for (const item of doc.items) {
    const product = await productRepo.findById(item.productId.toString());
    if (!product) continue;
    const p = product as Record<string, unknown> & { name: string; price: number; imageUrl?: string; sellerId: Types.ObjectId };
    out.push({
      productId: item.productId.toString(),
      quantity: item.quantity,
      name: p.name,
      price: Number(p.price) ?? 0,
      imageUrl: p.imageUrl,
      sellerId: (p.sellerId as Types.ObjectId).toString(),
    });
  }
  return out;
}

interface ShippingAddressBody {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  zip?: string;
  country: string;
  phone?: string;
}

function parseShippingFromBody(body: unknown): ShippingAddressBody | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const line1 = typeof b.line1 === "string" ? b.line1.trim() : "";
  const city = typeof b.city === "string" ? b.city.trim() : "";
  const country = typeof b.country === "string" ? b.country.trim() : "";
  if (!line1 || !city || !country) return null;
  return {
    line1,
    line2: typeof b.line2 === "string" ? b.line2.trim() : undefined,
    city,
    state: typeof b.state === "string" ? b.state.trim() : undefined,
    zip: typeof b.zip === "string" ? b.zip.trim() : undefined,
    country,
    phone: typeof b.phone === "string" ? b.phone.trim() : undefined,
  };
}

export async function createCheckoutSession(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const stripe = getStripeClient();
  if (!stripe) {
    errorResponse(res, 503, "Stripe is not configured");
    return;
  }
  const frontendUrl = (env.FRONTEND_URL ?? "").trim() || "http://localhost:3001";
  const successUrl = `${frontendUrl.replace(/\/$/, "")}/dashboard/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${frontendUrl.replace(/\/$/, "")}/dashboard/checkout/cancelled`;

  const shippingAddress = parseShippingFromBody(req.body.shippingAddress ?? req.body.shipping_address);
  if (!shippingAddress) {
    errorResponse(res, 400, "Please provide a delivery address");
    return;
  }

  const items = await getCartWithDetails(user.id);
  if (items.length === 0) {
    errorResponse(res, 400, "Your cart is empty");
    return;
  }

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => {
    const imageUrl = item.imageUrl && item.imageUrl.startsWith("https") ? item.imageUrl : undefined;
    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: imageUrl ? [imageUrl] : undefined,
        },
        unit_amount: Math.max(1, Math.round(Number(item.price) * 100)),
      },
      quantity: item.quantity,
    };
  });

  const metadata: Record<string, string> = {};
  if (shippingAddress) {
    metadata.shipping = JSON.stringify(shippingAddress);
  }
  const urgent = req.body.urgent === true || req.body.urgent === "true";
  metadata.urgent = String(urgent);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: user.id,
      metadata: Object.keys(metadata).length ? metadata : undefined,
    });
    successResponse(res, 200, "Checkout session created", {
      url: session.url,
      sessionId: session.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    const stripeMessage = err && typeof err === "object" && "message" in err && typeof (err as { message: string }).message === "string"
      ? (err as { message: string }).message
      : message;
    console.error("[Stripe checkout error]", stripeMessage, err);
    errorResponse(res, 500, stripeMessage);
  }
}

/** After Stripe redirect: verify session, create orders from cart (one per seller), clear cart. */
export async function confirmCheckoutSuccess(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const sessionId = typeof req.body.session_id === "string" ? req.body.session_id.trim() : undefined;
  if (!sessionId) {
    errorResponse(res, 400, "session_id is required");
    return;
  }
  const stripe = getStripeClient();
  if (!stripe) {
    errorResponse(res, 503, "Stripe is not configured");
    return;
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    errorResponse(res, 400, "Invalid session");
    return;
  }
  if (session.payment_status !== "paid") {
    errorResponse(res, 400, "Payment was not completed");
    return;
  }
  if (session.client_reference_id !== user.id) {
    errorResponse(res, 403, "Session does not belong to this user");
    return;
  }

  const items = await getCartWithDetails(user.id);
  if (items.length === 0) {
    successResponse(res, 200, "Orders already created", { orders: [] });
    return;
  }

  let shippingAddress: import("../repositories/order.repository").ShippingAddressInput | undefined;
  if (session.metadata?.shipping) {
    try {
      const parsed = JSON.parse(session.metadata.shipping) as ShippingAddressBody;
      if (parsed.line1 && parsed.city && parsed.country) {
        shippingAddress = {
          line1: parsed.line1,
          line2: parsed.line2,
          city: parsed.city,
          state: parsed.state,
          zip: parsed.zip,
          country: parsed.country,
          phone: parsed.phone,
        };
      }
    } catch {
      // ignore invalid metadata
    }
  }

  const urgent = session.metadata?.urgent === "true";
  const rider = await riderRepo.pickRandomRider();
  const riderId = rider?._id?.toString();

  const bySeller = new Map<string, Array<{ productId: string; productName: string; quantity: number; price: number }>>();
  for (const item of items) {
    const list = bySeller.get(item.sellerId) ?? [];
    list.push({
      productId: item.productId,
      productName: item.name,
      quantity: item.quantity,
      price: item.price,
    });
    bySeller.set(item.sellerId, list);
  }

  const orders: Array<{ id: string; sellerId: string; total: number; status: string; items: unknown[]; shippingAddress?: unknown }> = [];
  for (const [sellerId, sellerItems] of bySeller) {
    const total = sellerItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const order = await orderRepo.createOrder({
      buyerId: user.id,
      sellerId,
      items: sellerItems,
      total,
      status: "paid",
      stripeSessionId: session.id,
      shippingAddress,
      riderId: riderId ?? undefined,
      urgent,
    });
    const o = order as Record<string, unknown> & { _id: { toString(): string }; sellerId: unknown; total: number; status: string; items: unknown[]; shippingAddress?: unknown };
    const orderId = o._id.toString();
    orders.push({
      id: orderId,
      sellerId: (o.sellerId as Types.ObjectId).toString(),
      total: o.total,
      status: o.status,
      items: o.items ?? [],
      shippingAddress: o.shippingAddress,
    });
    try {
      const { draftOrderId } = await createShopifyDraftOrder({
        lineItems: sellerItems.map((i) => ({ title: i.productName, quantity: i.quantity, price: i.price })),
        note: `BazarCo order ${orderId}`,
        shippingAddress: shippingAddress
          ? {
              line1: shippingAddress.line1,
              city: shippingAddress.city,
              country: shippingAddress.country,
              zip: shippingAddress.zip,
              state: shippingAddress.state,
            }
          : undefined,
      });
      if (draftOrderId) await completeShopifyDraftOrder(draftOrderId);
    } catch {
      // non-fatal
    }
  }

  await cartRepo.clearCart(user.id);

  if (urgent && env.APP_MAIL && orders.length > 0) {
    try {
      const orderList = orders.map((o) => `#${o.id.slice(-8)}`).join(", ");
      await emailHelper.sendEmail({
        to: env.APP_MAIL,
        subject: "[BazarCo] Priority delivery – please prioritize",
        text: `The following order(s) have been marked as urgent delivery: ${orderList}. Please prioritize.`,
        html: `<p>The following order(s) have been marked as <strong>urgent delivery</strong>: ${orderList}. Please prioritize.</p>`,
      });
    } catch {
      // non-fatal
    }
  }

  successResponse(res, 200, "Orders created", { orders });
}
