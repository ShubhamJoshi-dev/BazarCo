import type { Request, Response } from "express";
import { errorResponse, successResponse } from "../helpers/response.helper";
import * as conversationRepo from "../repositories/conversation.repository";
import * as messageRepo from "../repositories/message.repository";
import * as orderRepo from "../repositories/order.repository";
import * as productRepo from "../repositories/product.repository";
import * as offerRepo from "../repositories/offer.repository";
import { env } from "../config/env";

type ReqWithUser = Request & { user?: { id: string } };

function idToString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  const obj = v as { _id?: unknown };
  if (obj._id != null && typeof (obj._id as { toString?: () => string }).toString === "function") return (obj._id as { toString: () => string }).toString();
  if (typeof (v as { toString?: () => string }).toString === "function") return (v as { toString: () => string }).toString();
  return String(v);
}

function toConversationDto(c: Record<string, unknown> & { _id: { toString(): string }; buyerId: unknown; sellerId: unknown; orderId?: unknown; productId?: unknown; updatedAt?: Date }) {
  const buyer = c.buyerId as { _id: { toString(): string }; name?: string; email?: string } | null;
  const seller = c.sellerId as { _id: { toString(): string }; name?: string; email?: string } | null;
  const order = c.orderId as { _id: { toString(): string }; total?: number; status?: string } | null;
  const product = c.productId as { _id: { toString(): string }; name?: string; price?: number; imageUrl?: string } | null;
  return {
    id: c._id.toString(),
    buyerId: buyer?._id?.toString?.() ?? idToString(c.buyerId),
    sellerId: seller?._id?.toString?.() ?? idToString(c.sellerId),
    buyer: buyer ? { id: buyer._id.toString(), name: buyer.name, email: buyer.email } : null,
    seller: seller ? { id: seller._id.toString(), name: seller.name, email: seller.email } : null,
    orderId: order?._id?.toString?.() ?? idToString(c.orderId),
    order: order ? { id: order._id.toString(), total: order.total, status: order.status } : null,
    productId: product?._id?.toString?.() ?? idToString(c.productId),
    product: product ? { id: product._id.toString(), name: product.name, price: product.price, imageUrl: product.imageUrl } : null,
    updatedAt: (c.updatedAt as Date)?.toISOString?.(),
  };
}

/** Build a JSON-safe conversation DTO from raw doc (e.g. from createOrGetByProduct) so we never send ObjectId/buffer. */
function conversationToDto(conv: { id?: string; _id?: unknown; buyerId?: unknown; sellerId?: unknown; productId?: unknown; orderId?: unknown; updatedAt?: unknown }) {
  return {
    id: conv.id ?? idToString(conv._id),
    buyerId: idToString(conv.buyerId),
    sellerId: idToString(conv.sellerId),
    buyer: null,
    seller: null,
    orderId: conv.orderId != null ? idToString(conv.orderId) : null,
    order: null,
    productId: conv.productId != null ? idToString(conv.productId) : null,
    product: null,
    updatedAt: (conv.updatedAt as Date)?.toISOString?.(),
  };
}

function toMessageDto(m: Record<string, unknown> & { messageId: string; senderId: unknown; receiverId: unknown; createdAt: Date; updatedAt: Date }) {
  return {
    messageId: m.messageId,
    conversationId: (m.conversationId as { toString(): string })?.toString?.() ?? m.conversationId,
    senderId: (m.senderId as { toString(): string })?.toString?.() ?? m.senderId,
    receiverId: (m.receiverId as { toString(): string })?.toString?.() ?? m.receiverId,
    role: m.role,
    content: m.content,
    messageType: m.messageType ?? "text",
    status: m.status ?? "sent",
    isUnsent: !!m.isUnsent,
    createdAt: (m.createdAt as Date)?.toISOString?.(),
    updatedAt: (m.updatedAt as Date)?.toISOString?.(),
  };
}

export async function listConversations(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const list = await conversationRepo.findByParticipant(user.id);
  const pairKey = (c: Parameters<typeof toConversationDto>[0]) => {
    const b = idToString(c.buyerId);
    const s = idToString(c.sellerId);
    return [b, s].sort().join(",");
  };
  const byPair = new Map<string, Parameters<typeof toConversationDto>[0] & { orderId?: unknown; productId?: unknown; updatedAt?: Date }>();
  for (const c of list) {
    const conv = c as Parameters<typeof toConversationDto>[0] & { orderId?: unknown; productId?: unknown; updatedAt?: Date };
    const key = pairKey(conv);
    const isUserConvo = conv.orderId == null && conv.productId == null;
    const existing = byPair.get(key);
    if (!existing) {
      byPair.set(key, conv);
      continue;
    }
    const existingIsUser = (existing as { orderId?: unknown; productId?: unknown }).orderId == null && (existing as { orderId?: unknown; productId?: unknown }).productId == null;
    if (isUserConvo && !existingIsUser) byPair.set(key, conv);
    else if (!isUserConvo && existingIsUser) { /* keep existing */ }
    else if (new Date(conv.updatedAt ?? 0).getTime() > new Date(existing.updatedAt ?? 0).getTime()) byPair.set(key, conv);
  }
  const deduped = Array.from(byPair.values()).sort((a, b) => new Date((b as { updatedAt?: Date }).updatedAt ?? 0).getTime() - new Date((a as { updatedAt?: Date }).updatedAt ?? 0).getTime());
  const conversations = deduped.map((c) => toConversationDto(c as Parameters<typeof toConversationDto>[0]));
  successResponse(res, 200, "Conversations listed", { conversations });
}

export async function getConversation(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const id = req.params.id as string;
  const conv = await conversationRepo.findById(id);
  if (!conv) {
    errorResponse(res, 404, "Conversation not found");
    return;
  }
  if (!conversationRepo.isParticipant(conv, user.id)) {
    errorResponse(res, 403, "Not allowed to access this conversation");
    return;
  }
  successResponse(res, 200, "Conversation", { conversation: toConversationDto(conv as Parameters<typeof toConversationDto>[0]) });
}

export async function createConversation(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const body = req.body as { orderId?: string; productId?: string; offerId?: string; offer_id?: string };
  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : undefined;
  const productId = typeof body.productId === "string" ? body.productId.trim() : undefined;
  const offerIdRaw = typeof body.offerId === "string" ? body.offerId.trim() : typeof (body as { offer_id?: string }).offer_id === "string" ? (body as { offer_id: string }).offer_id.trim() : undefined;

  if (offerIdRaw) {
    const offer = await offerRepo.findById(offerIdRaw);
    if (!offer) {
      errorResponse(res, 404, "Offer not found");
      return;
    }
    const toId = (ref: unknown): string => {
      if (ref == null) return "";
      if (typeof ref === "string") return ref.trim();
      const obj = ref as { _id?: unknown };
      if (obj._id != null) {
        if (typeof (obj._id as { toString?: () => string }).toString === "function") return (obj._id as { toString: () => string }).toString();
        if (typeof obj._id === "string") return obj._id;
      }
      if (typeof (ref as { toString?: () => string }).toString === "function") return (ref as { toString: () => string }).toString();
      return "";
    };
    const pId = toId((offer as { productId?: unknown }).productId);
    const buyerId = toId((offer as { buyerId?: unknown }).buyerId);
    const sellerId = toId((offer as { sellerId?: unknown }).sellerId);
    if (!pId || !buyerId || !sellerId) {
      errorResponse(res, 400, "Offer is missing product, buyer, or seller");
      return;
    }
    if (user.id !== buyerId && user.id !== sellerId) {
      errorResponse(res, 403, "You are not a participant of this offer");
      return;
    }
    const conv = await conversationRepo.createOrGetByUser(buyerId, sellerId);
    const full = await conversationRepo.findById(conv.id);
    const conversation = full ? toConversationDto(full as Parameters<typeof toConversationDto>[0]) : conversationToDto(conv);
    successResponse(res, 201, "Conversation", { conversation });
    return;
  }

  if (orderId) {
    const order = await orderRepo.findById(orderId);
    if (!order) {
      errorResponse(res, 404, "Order not found");
      return;
    }
    const o = order as { buyerId: { toString(): string }; sellerId: { toString(): string } };
    const buyerId = o.buyerId?.toString?.() ?? "";
    const sellerId = o.sellerId?.toString?.() ?? "";
    if (user.id !== buyerId && user.id !== sellerId) {
      errorResponse(res, 403, "You are not a participant of this order");
      return;
    }
    const conv = await conversationRepo.createOrGetByUser(buyerId, sellerId);
    const full = await conversationRepo.findById(conv.id);
    successResponse(res, 201, "Conversation", { conversation: full ? toConversationDto(full as Parameters<typeof toConversationDto>[0]) : conversationToDto(conv) });
    return;
  }

  if (productId) {
    const product = await productRepo.findById(productId);
    if (!product) {
      errorResponse(res, 404, "Product not found");
      return;
    }
    const p = product as { sellerId: { toString(): string } };
    const sellerId = p.sellerId?.toString?.() ?? "";
    if (user.id === sellerId) {
      errorResponse(res, 400, "Seller cannot start a product chat with themselves; use order chat when you have an order.");
      return;
    }
    const buyerId = user.id;
    const conv = await conversationRepo.createOrGetByUser(buyerId, sellerId);
    const full = await conversationRepo.findById(conv.id);
    successResponse(res, 201, "Conversation", { conversation: full ? toConversationDto(full as Parameters<typeof toConversationDto>[0]) : conversationToDto(conv) });
    return;
  }

  errorResponse(res, 400, "Provide orderId, productId, or offerId");
}

export async function getMessages(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const conversationId = req.params.id as string;
  const conv = await conversationRepo.findById(conversationId);
  if (!conv) {
    errorResponse(res, 404, "Conversation not found");
    return;
  }
  if (!conversationRepo.isParticipant(conv, user.id)) {
    errorResponse(res, 403, "Not allowed to access this conversation");
    return;
  }
  const buyerId = idToString((conv as { buyerId?: unknown }).buyerId);
  const sellerId = idToString((conv as { sellerId?: unknown }).sellerId);
  const allConvIds = await conversationRepo.findAllIdsByUserPair(buyerId, sellerId);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const before = typeof req.query.before === "string" ? req.query.before : undefined;
  const beforeMessageId = typeof req.query.beforeMessageId === "string" ? req.query.beforeMessageId : undefined;
  const beforeDate = before ? new Date(before) : undefined;
  if (before && isNaN(beforeDate!.getTime())) {
    errorResponse(res, 400, "Invalid before date");
    return;
  }
  const messages =
    allConvIds.length <= 1
      ? await messageRepo.getByConversationPaginated(conversationId, { limit, before: beforeDate, beforeMessageId })
      : await messageRepo.getByConversationIdsPaginated(allConvIds, { limit, before: beforeDate, beforeMessageId });
  successResponse(res, 200, "Messages", {
    messages: messages.map((m) => toMessageDto(m as Parameters<typeof toMessageDto>[0])),
  });
}

export async function unsendMessage(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const messageId = req.params.messageId as string;
  const result = await messageRepo.unsend(messageId, user.id, env.UNSEND_MESSAGE_WINDOW_MINUTES);
  if (!result.success) {
    errorResponse(res, 400, "Cannot unsend this message (not found, not yours, or outside time window)");
    return;
  }
  successResponse(res, 200, "Message unsent", { message: result.message ? toMessageDto(result.message as Parameters<typeof toMessageDto>[0]) : null });
}
