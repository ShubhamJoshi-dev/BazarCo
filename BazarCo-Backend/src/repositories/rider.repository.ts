import type { Types } from "mongoose";
import { Rider } from "../models/rider.model";

export interface RiderDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  phone?: string;
  isActive: boolean;
}

export async function getActiveRiders(): Promise<RiderDoc[]> {
  const docs = await Rider.find({ isActive: true }).lean();
  return docs as RiderDoc[];
}

export async function findById(id: string) {
  const doc = await Rider.findById(id).populate("userId", "name email").lean();
  return doc ?? null;
}

export async function pickRandomRider(): Promise<RiderDoc | null> {
  const riders = await getActiveRiders();
  if (riders.length === 0) return null;
  const idx = Math.floor(Math.random() * riders.length);
  return riders[idx] ?? null;
}
