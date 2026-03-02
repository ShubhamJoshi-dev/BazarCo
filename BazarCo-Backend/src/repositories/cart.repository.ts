import type { Types } from "mongoose";
import { Cart } from "../models/cart.model";

export async function getCart(userId: string) {
  const doc = await Cart.findOne({ userId }).lean();
  return doc ?? null;
}

export async function addOrUpdateItem(userId: string, productId: string, quantity: number) {
  const mongoose = await import("mongoose");
  const uid = new mongoose.Types.ObjectId(userId);
  const pid = new mongoose.Types.ObjectId(productId);
  const cart = await Cart.findOne({ userId: uid });
  if (!cart) {
    await Cart.create({ userId: uid, items: [{ productId: pid, quantity }] });
    return getCart(userId);
  }
  const items = (cart.items as Array<{ productId: Types.ObjectId; quantity: number }>) ?? [];
  const idx = items.findIndex((i) => i.productId.toString() === productId);
  if (idx >= 0) {
    items[idx].quantity = Math.max(1, quantity);
  } else {
    items.push({ productId: pid, quantity: Math.max(1, quantity) });
  }
  cart.items = items;
  await cart.save();
  return getCart(userId);
}

export async function removeItem(userId: string, productId: string) {
  const mongoose = await import("mongoose");
  const result = await Cart.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId) },
    { $pull: { items: { productId: new mongoose.Types.ObjectId(productId) } } },
    { new: true }
  ).lean();
  return result ?? null;
}

export async function setItemQuantity(userId: string, productId: string, quantity: number) {
  if (quantity < 1) return removeItem(userId, productId);
  return addOrUpdateItem(userId, productId, quantity);
}

export async function clearCart(userId: string) {
  const mongoose = await import("mongoose");
  const result = await Cart.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId) },
    { $set: { items: [] } },
    { new: true }
  ).lean();
  return result ?? null;
}
