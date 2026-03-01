import type { Types } from "mongoose";
import { Product, type ProductStatus } from "../models/product.model";

export async function createProduct(data: {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId?: Types.ObjectId | string;
  tagIds?: (Types.ObjectId | string)[];
  shopifyProductId?: string;
  sellerId: string | Types.ObjectId;
}) {
  const doc = await Product.create(data);
  return doc.toObject() as Record<string, unknown> & { _id: Types.ObjectId; sellerId: Types.ObjectId };
}

export async function findById(id: string) {
  const doc = await Product.findById(id).lean();
  return doc ?? null;
}

export async function findBySellerId(sellerId: string, options?: { status?: ProductStatus }) {
  const query: Record<string, unknown> = { sellerId };
  if (options?.status) query.status = options.status;
  const docs = await Product.find(query).sort({ createdAt: -1 }).lean();
  return docs;
}

export async function updateProduct(
  id: string,
  sellerId: string,
  data: {
    name?: string;
    description?: string;
    price?: number;
    imageUrl?: string;
    categoryId?: Types.ObjectId | string | null;
    tagIds?: (Types.ObjectId | string)[];
    status?: ProductStatus;
  }
) {
  const doc = await Product.findOneAndUpdate(
    { _id: id, sellerId },
    { $set: data },
    { new: true }
  ).lean();
  return doc ?? null;
}

export async function deleteProduct(id: string, sellerId: string) {
  const result = await Product.findOneAndDelete({ _id: id, sellerId });
  return !!result;
}

export async function findActiveForBrowse(options: {
  query?: string;
  categoryId?: string;
  tagIds?: string[];
  limit: number;
  skip: number;
}) {
  const { query, categoryId, tagIds, limit, skip } = options;
  const filter: Record<string, unknown> = { status: "active" };
  if (categoryId?.trim()) filter.categoryId = categoryId.trim();
  if (tagIds?.length) filter.tagIds = { $in: tagIds };
  if (query?.trim()) {
    const q = query.trim();
    filter.$or = [
      { name: new RegExp(q, "i") },
      { description: new RegExp(q, "i") },
    ];
  }
  const [docs, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);
  return { docs, total };
}
