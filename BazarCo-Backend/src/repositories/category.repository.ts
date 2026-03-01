import type { Types } from "mongoose";
import { Category } from "../models/category.model";

export async function listCategories(): Promise<{ id: string; name: string }[]> {
  const docs = await Category.find().sort({ name: 1 }).lean();
  return docs.map((d) => ({ id: (d._id as Types.ObjectId).toString(), name: d.name }));
}

export async function createCategory(name: string): Promise<{ id: string; name: string } | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const existing = await Category.findOne({ name: new RegExp(`^${trimmed}$`, "i") }).lean();
  if (existing) return { id: (existing._id as Types.ObjectId).toString(), name: existing.name };
  const doc = await Category.create({ name: trimmed });
  return { id: doc._id.toString(), name: doc.name };
}

export async function deleteCategory(id: string): Promise<boolean> {
  const result = await Category.findByIdAndDelete(id);
  return !!result;
}

export async function findCategoryById(id: string): Promise<{ id: string; name: string } | null> {
  const doc = await Category.findById(id).lean();
  if (!doc) return null;
  return { id: (doc._id as Types.ObjectId).toString(), name: doc.name };
}
