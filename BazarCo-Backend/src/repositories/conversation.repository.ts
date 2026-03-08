import mongoose, { type Types } from "mongoose";
import { Conversation } from "../models/conversation.model";

function toObjectId(id: string): Types.ObjectId | string {
  if (mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id) {
    return new mongoose.Types.ObjectId(id);
  }
  return id;
}

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

/** One conversation per (buyer, seller) when productId is null (unified chat). Reuse existing if any (e.g. from order). */
export async function createOrGetByUser(buyerId: string, sellerId: string) {
  // Find any existing convo with this pair and productId null (unique index allows only one)
  let doc = await Conversation.findOne({ buyerId, sellerId, productId: null }).lean();
  if (doc) return { ...doc, id: doc._id.toString() };
  try {
    doc = (await Conversation.create({ buyerId, sellerId, orderId: null, productId: null })).toObject();
    return { ...doc, id: doc._id.toString() };
  } catch (err: unknown) {
    const isDup = err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000;
    if (isDup) {
      const existing = await Conversation.findOne({ buyerId, sellerId, productId: null }).lean();
      if (existing) return { ...existing, id: existing._id.toString() };
    }
    throw err;
  }
}

/** All conversation ids for a given (buyerId, sellerId) pair (for merging messages). */
export async function findAllIdsByUserPair(buyerId: string, sellerId: string): Promise<string[]> {
  const docs = await Conversation.find({ buyerId, sellerId }).select("_id").lean();
  return docs.map((d) => d._id.toString());
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
  const uid = toObjectId(userId);
  const docs = await Conversation.find({
    $or: [{ buyerId: uid }, { sellerId: uid }],
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
