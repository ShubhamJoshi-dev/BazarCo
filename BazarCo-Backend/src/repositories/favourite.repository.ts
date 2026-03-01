import type { Types } from "mongoose";
import { Favourite } from "../models/favourite.model";

export async function addFavourite(userId: string, productId: string): Promise<boolean> {
  try {
    await Favourite.create({ userId, productId });
    return true;
  } catch {
    return false; // duplicate or invalid ref
  }
}

export async function removeFavourite(userId: string, productId: string): Promise<boolean> {
  const result = await Favourite.findOneAndDelete({ userId, productId });
  return !!result;
}

export async function isFavourite(userId: string, productId: string): Promise<boolean> {
  const doc = await Favourite.findOne({ userId, productId }).lean();
  return !!doc;
}

export async function listFavouriteProductIds(userId: string): Promise<string[]> {
  const docs = await Favourite.find({ userId }).select("productId").lean();
  return docs.map((d) => (d.productId as Types.ObjectId).toString());
}
