import type { Types } from "mongoose";
import { Message, type MessageRole, type MessageType } from "../models/message.model";

const UNSENT_PLACEHOLDER = "This message was unsent";

export async function create(data: {
  conversationId: string | Types.ObjectId;
  senderId: string | Types.ObjectId;
  receiverId: string | Types.ObjectId;
  role: MessageRole;
  content: string;
  messageType?: MessageType;
}) {
  const doc = await Message.create({
    ...data,
    messageType: data.messageType ?? "text",
  });
  return doc.toObject();
}

export async function findByMessageId(messageId: string) {
  const doc = await Message.findOne({ messageId }).lean();
  return doc ?? null;
}

export async function findById(id: string) {
  const doc = await Message.findById(id).lean();
  return doc ?? null;
}

export async function getByConversationPaginated(
  conversationId: string,
  options: { limit: number; before?: Date; beforeMessageId?: string }
) {
  const query: Record<string, unknown> = { conversationId };
  if (options.before || options.beforeMessageId) {
    if (options.beforeMessageId) {
      const beforeMsg = await Message.findOne({ conversationId, messageId: options.beforeMessageId }).lean();
      if (beforeMsg) query.createdAt = { $lt: beforeMsg.createdAt };
    } else if (options.before) {
      query.createdAt = { $lt: options.before };
    }
  }
  const docs = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit)
    .lean();
  return docs.reverse();
}

export async function markDelivered(conversationId: string, receiverId: string) {
  await Message.updateMany(
    { conversationId, receiverId, status: "sent" },
    { $set: { status: "delivered" } }
  );
}

export async function markSeen(conversationId: string, receiverId: string) {
  await Message.updateMany(
    { conversationId, receiverId, status: { $in: ["sent", "delivered"] } },
    { $set: { status: "seen" } }
  );
}

export async function unsend(messageId: string, senderId: string, unsendWindowMinutes: number): Promise<{ success: boolean; message?: object }> {
  const doc = await Message.findOne({ messageId }).lean();
  if (!doc) return { success: false };
  if (doc.senderId.toString() !== senderId) return { success: false };
  if (doc.isUnsent) return { success: true, message: { ...doc, content: UNSENT_PLACEHOLDER } };
  const cutoff = new Date(Date.now() - unsendWindowMinutes * 60 * 1000);
  if (new Date(doc.createdAt) < cutoff) return { success: false };
  const updated = await Message.findOneAndUpdate(
    { messageId },
    { $set: { content: UNSENT_PLACEHOLDER, isUnsent: true }, $currentDate: { updatedAt: true } },
    { new: true }
  ).lean();
  return { success: true, message: updated ?? undefined };
}
