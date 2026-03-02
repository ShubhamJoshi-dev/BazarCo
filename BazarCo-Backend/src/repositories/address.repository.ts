import mongoose from "mongoose";
import { Address } from "../models/address.model";

export interface AddressInput {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  zip?: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

export async function listByUserId(userId: string) {
  const docs = await Address.find({ userId: new mongoose.Types.ObjectId(userId) })
    .sort({ isDefault: -1, createdAt: -1 })
    .lean();
  return docs;
}

export async function create(userId: string, data: AddressInput) {
  const uid = new mongoose.Types.ObjectId(userId);
  if (data.isDefault) {
    await Address.updateMany({ userId: uid }, { $set: { isDefault: false } });
  }
  const doc = await Address.create({
    userId: uid,
    label: data.label ?? "Shipping",
    line1: data.line1.trim(),
    line2: data.line2?.trim(),
    city: data.city.trim(),
    state: data.state?.trim(),
    zip: data.zip?.trim(),
    country: data.country.trim(),
    phone: data.phone?.trim(),
    isDefault: data.isDefault ?? false,
  });
  return doc.toObject();
}

export async function findById(id: string, userId: string) {
  const doc = await Address.findOne({
    _id: new mongoose.Types.ObjectId(id),
    userId: new mongoose.Types.ObjectId(userId),
  }).lean();
  return doc ?? null;
}

export async function update(id: string, userId: string, data: Partial<AddressInput>) {
  const uid = new mongoose.Types.ObjectId(userId);
  if (data.isDefault) {
    await Address.updateMany({ userId: uid }, { $set: { isDefault: false } });
  }
  const updatePayload: Record<string, unknown> = {};
  if (data.label !== undefined) updatePayload.label = data.label;
  if (data.line1 !== undefined) updatePayload.line1 = data.line1.trim();
  if (data.line2 !== undefined) updatePayload.line2 = data.line2?.trim();
  if (data.city !== undefined) updatePayload.city = data.city.trim();
  if (data.state !== undefined) updatePayload.state = data.state?.trim();
  if (data.zip !== undefined) updatePayload.zip = data.zip?.trim();
  if (data.country !== undefined) updatePayload.country = data.country.trim();
  if (data.phone !== undefined) updatePayload.phone = data.phone?.trim();
  if (data.isDefault !== undefined) updatePayload.isDefault = data.isDefault;
  const doc = await Address.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id), userId: uid },
    { $set: updatePayload },
    { new: true }
  ).lean();
  return doc ?? null;
}

export async function remove(id: string, userId: string) {
  const result = await Address.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(id),
    userId: new mongoose.Types.ObjectId(userId),
  });
  return result ?? null;
}

export async function getDefault(userId: string) {
  const uid = new mongoose.Types.ObjectId(userId);
  const doc = await Address.findOne({ userId: uid, isDefault: true }).lean();
  if (doc) return doc;
  const first = await Address.findOne({ userId: uid }).sort({ createdAt: 1 }).lean();
  return first ?? null;
}
