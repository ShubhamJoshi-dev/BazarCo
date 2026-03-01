import type { Types } from "mongoose";
import { Tag } from "../models/tag.model";

export async function listTags(): Promise<{ id: string; name: string }[]> {
  const docs = await Tag.find().sort({ name: 1 }).lean();
  return docs.map((d) => ({ id: (d._id as Types.ObjectId).toString(), name: d.name }));
}

export async function createTag(name: string): Promise<{ id: string; name: string } | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const existing = await Tag.findOne({ name: new RegExp(`^${trimmed}$`, "i") }).lean();
  if (existing) return { id: (existing._id as Types.ObjectId).toString(), name: existing.name };
  const doc = await Tag.create({ name: trimmed });
  return { id: doc._id.toString(), name: doc.name };
}

export async function deleteTag(id: string): Promise<boolean> {
  const result = await Tag.findByIdAndDelete(id);
  return !!result;
}

export async function findTagById(id: string): Promise<{ id: string; name: string } | null> {
  const doc = await Tag.findById(id).lean();
  if (!doc) return null;
  return { id: (doc._id as Types.ObjectId).toString(), name: doc.name };
}
