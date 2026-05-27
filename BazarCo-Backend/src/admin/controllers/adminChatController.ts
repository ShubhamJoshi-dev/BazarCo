import type { Request, Response } from "express";
import { errorResponse, successResponse } from "../../helpers/response.helper";
import { Conversation } from "../../models/conversation.model";
import { Message } from "../../models/message.model";
import { parsePagination, paginationMeta } from "../lib/pagination";
import type { AdminAuthUser } from "../middleware/requireAdminAuth.middleware";
import { logAdminAction } from "../services/audit.service";

export async function listConversations(req: Request, res: Response): Promise<void> {
  const { page, limit, sort, order, skip } = parsePagination(req.query as Record<string, unknown>);
  const [items, total] = await Promise.all([
    Conversation.find({}).sort({ [sort]: order }).skip(skip).limit(limit).lean(),
    Conversation.countDocuments({}),
  ]);
  successResponse(res, 200, "Conversations", {
    conversations: items.map((c) => ({
      id: String(c._id),
      buyerId: String(c.buyerId),
      sellerId: String(c.sellerId),
      updatedAt: c.updatedAt,
      createdAt: c.createdAt,
    })),
    pagination: paginationMeta(total, page, limit),
  });
}

export async function getConversationMessages(req: Request, res: Response): Promise<void> {
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>, { limit: 50 });
  const conversationId = req.params.id;
  const filter = { conversationId, adminDeleted: false };
  const [items, total] = await Promise.all([
    Message.find(filter).sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
    Message.countDocuments(filter),
  ]);
  successResponse(res, 200, "Conversation messages", {
    messages: items.map((m) => ({
      id: String(m._id),
      messageId: m.messageId,
      conversationId: String(m.conversationId),
      senderId: String(m.senderId),
      receiverId: String(m.receiverId),
      role: m.role,
      content: m.content,
      messageType: m.messageType,
      flagged: m.flagged,
      createdAt: m.createdAt,
    })),
    pagination: paginationMeta(total, page, limit),
  });
}

export async function searchMessages(req: Request, res: Response): Promise<void> {
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>, { limit: 50 });
  const filter: Record<string, unknown> = { adminDeleted: false };
  if (typeof req.query.q === "string" && req.query.q.trim()) {
    filter.content = new RegExp(req.query.q.trim(), "i");
  }
  if (req.query.flagged === "true") filter.flagged = true;
  if (typeof req.query.conversationId === "string") filter.conversationId = req.query.conversationId;

  const [items, total] = await Promise.all([
    Message.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Message.countDocuments(filter),
  ]);
  successResponse(res, 200, "Messages", {
    messages: items.map((m) => ({
      id: String(m._id),
      messageId: m.messageId,
      conversationId: String(m.conversationId),
      senderId: String(m.senderId),
      receiverId: String(m.receiverId),
      content: m.content,
      flagged: m.flagged,
      adminDeleted: m.adminDeleted,
      createdAt: m.createdAt,
    })),
    pagination: paginationMeta(total, page, limit),
  });
}

export async function deleteMessage(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { admin: AdminAuthUser }).admin;
  const note = typeof req.body.moderationNote === "string" ? req.body.moderationNote.slice(0, 500) : "Removed by admin";
  const msg = await Message.findOneAndUpdate(
    { messageId: req.params.messageId },
    { $set: { adminDeleted: true, moderationNote: note, content: "[Message removed by moderator]" } },
    { new: true }
  );
  if (!msg) {
    errorResponse(res, 404, "Message not found");
    return;
  }
  await logAdminAction({ adminId: admin.id, adminUsername: admin.username, action: "chat.delete_message", resource: "message", resourceId: req.params.messageId });
  successResponse(res, 200, "Message moderated");
}

export async function flagMessage(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { admin: AdminAuthUser }).admin;
  const flagged = req.body.flagged !== false;
  const msg = await Message.findOneAndUpdate(
    { messageId: req.params.messageId },
    { $set: { flagged } },
    { new: true }
  );
  if (!msg) {
    errorResponse(res, 404, "Message not found");
    return;
  }
  await logAdminAction({ adminId: admin.id, adminUsername: admin.username, action: "chat.flag_message", resource: "message", resourceId: req.params.messageId });
  successResponse(res, 200, "Message flag updated");
}
