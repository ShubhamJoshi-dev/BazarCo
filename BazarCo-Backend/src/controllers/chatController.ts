import type { Request, Response } from "express";
import { errorResponse, successResponse } from "../helpers/response.helper";
import * as conversationRepo from "../repositories/conversation.repository";
import * as messageRepo from "../repositories/message.repository";
import * as orderRepo from "../repositories/order.repository";
import * as productRepo from "../repositories/product.repository";
import { env } from "../config/env";

type ReqWithUser = Request & { user?: { id: string } };

function toConversationDto(c: Record<string, unknown> & { _id: { toString(): string }; buyerId: unknown; sellerId: unknown; orderId?: unknown; productId?: unknown; updatedAt?: Date }) {
  const buyer = c.buyerId as { _id: { toString(): string }; name?: string; email?: string } | null;
  const seller = c.sellerId as { _id: { toString(): string }; name?: string; email?: string } | null;
  const order = c.orderId as { _id: { toString(): string }; total?: number; status?: string } | null;
  const product = c.productId as { _id: { toString(): string }; name?: string; price?: number; imageUrl?: string } | null;
  return {
    id: c._id.toString(),
    buyerId: buyer?._id?.toString?.() ?? (c.buyerId as object)?.toString?.() ?? c.buyerId,
    sellerId: seller?._id?.toString?.() ?? (c.sellerId as object)?.toString?.() ?? c.sellerId,
    buyer: buyer ? { id: buyer._id.toString(), name: buyer.name, email: buyer.email } : null,
    seller: seller ? { id: seller._id.toString(), name: seller.name, email: seller.email } : null,
    orderId: order?._id?.toString?.() ?? (c.orderId as object)?.toString?.() ?? c.orderId,
    order: order ? { id: order._id.toString(), total: order.total, status: order.status } : null,
    productId: product?._id?.toString?.() ?? (c.productId as object)?.toString?.() ?? c.productId,
    product: product ? { id: product._id.toString(), name: product.name, price: product.price, imageUrl: product.imageUrl } : null,
    updatedAt: (c.updatedAt as Date)?.toISOString?.(),
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
  const conversations = list.map((c) => toConversationDto(c as Parameters<typeof toConversationDto>[0]));
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
  const body = req.body as { orderId?: string; productId?: string };
  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : undefined;
  const productId = typeof body.productId === "string" ? body.productId.trim() : undefined;

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
    const conv = await conversationRepo.createOrGetByOrder(orderId, buyerId, sellerId);
    const full = await conversationRepo.findById(conv.id);
    successResponse(res, 201, "Conversation", { conversation: full ? toConversationDto(full as Parameters<typeof toConversationDto>[0]) : conv });
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
    const conv = await conversationRepo.createOrGetByProduct(productId, buyerId, sellerId);
    const full = await conversationRepo.findById(conv.id);
    successResponse(res, 201, "Conversation", { conversation: full ? toConversationDto(full as Parameters<typeof toConversationDto>[0]) : conv });
    return;
  }

  errorResponse(res, 400, "Provide orderId or productId");
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
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const before = typeof req.query.before === "string" ? req.query.before : undefined;
  const beforeMessageId = typeof req.query.beforeMessageId === "string" ? req.query.beforeMessageId : undefined;
  const beforeDate = before ? new Date(before) : undefined;
  if (before && isNaN(beforeDate!.getTime())) {
    errorResponse(res, 400, "Invalid before date");
    return;
  }
  const messages = await messageRepo.getByConversationPaginated(conversationId, {
    limit,
    before: beforeDate,
    beforeMessageId,
  });
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
