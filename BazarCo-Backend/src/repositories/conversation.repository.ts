import type { Types } from "mongoose";
import { Conversation } from "../models/conversation.model";

export async function createOrGetByOrder(orderId: string, buyerId: string, sellerId: string) {
  let doc = await Conversation.findOne({ orderId, buyerId, sellerId }).lean();
  if (doc) return { ...doc, id: doc._id.toString() };
  doc = (await Conversation.create({ orderId, buyerId, sellerId })).toObject();
  return { ...doc, id: doc._id.toString() };
}

export async function createOrGetByProduct(productId: string, buyerId: string, sellerId: string) {
  let doc = await Conversation.findOne({ productId, buyerId, sellerId }).lean();
  if (doc) return { ...doc, id: doc._id.toString() };
  doc = (await Conversation.create({ productId, buyerId, sellerId })).toObject();
  return { ...doc, id: doc._id.toString() };
}

export async function findById(id: string) {
  const doc = await Conversation.findById(id)
    .populate("buyerId", "name email")
    .populate("sellerId", "name email")
    .populate("orderId", "total status")
    .populate("productId", "name price imageUrl")
    .lean();
  return doc ?? null;
}

export async function findByParticipant(userId: string) {
  const docs = await Conversation.find({
    $or: [{ buyerId: userId }, { sellerId: userId }],
  })
    .populate("buyerId", "name email")
    .populate("sellerId", "name email")
    .populate("orderId", "total status")
    .populate("productId", "name price imageUrl")
    .sort({ updatedAt: -1 })
    .lean();
  return docs;
}

function toUserId(value: Types.ObjectId | string | { _id?: Types.ObjectId } | null | undefined): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  const obj = value as { _id?: Types.ObjectId };
  if (obj._id) return obj._id.toString();
  if (typeof (value as Types.ObjectId).toString === "function") return (value as Types.ObjectId).toString();
  return null;
}

export function isParticipant(conversation: { buyerId: Types.ObjectId | string | { _id?: Types.ObjectId }; sellerId: Types.ObjectId | string | { _id?: Types.ObjectId } }, userId: string): boolean {
  const b = toUserId(conversation.buyerId);
  const s = toUserId(conversation.sellerId);
  return b === userId || s === userId;
}
