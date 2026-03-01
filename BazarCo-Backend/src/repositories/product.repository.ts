import type { Types } from "mongoose";
import { Product, type ProductStatus } from "../models/product.model";
import { Category } from "../models/category.model";

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
  if (!sellerId || typeof sellerId !== "string") return [];
  let query: Record<string, unknown> = {};
  try {
    const mongoose = await import("mongoose");
    if (/^[a-fA-F0-9]{24}$/.test(sellerId)) {
      query.sellerId = new mongoose.Types.ObjectId(sellerId);
    } else {
      query.sellerId = sellerId;
    }
  } catch {
    query.sellerId = sellerId;
  }
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

/** Escape special regex characters so the search string is treated as literal. */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    const escaped = escapeRegex(query.trim());
    const regex = new RegExp(escaped, "i");
    filter.$or = [
      { name: regex },
      { description: regex },
    ];
  }
  const [docs, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);
  return { docs, total };
}

function isValidObjectId(id: string): boolean {
  return typeof id === "string" && /^[a-fA-F0-9]{24}$/.test(id);
}

export async function getSellerProductStats(sellerId: string): Promise<{
  total: number;
  active: number;
  archived: number;
  byCategory: { categoryId: string | null; categoryName: string; count: number }[];
}> {
  const empty = { total: 0, active: 0, archived: 0, byCategory: [] as { categoryId: string | null; categoryName: string; count: number }[] };
  if (!sellerId || !isValidObjectId(sellerId)) {
    return empty;
  }

  try {
    const mongoose = await import("mongoose");
    const oid = new mongoose.Types.ObjectId(sellerId);
    const [counts, byCategory] = await Promise.all([
      Product.aggregate<{ _id: string; count: number }>([
        { $match: { sellerId: oid } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Product.aggregate<{ _id: unknown; count: number }>([
        { $match: { sellerId: oid } },
        { $group: { _id: "$categoryId", count: { $sum: 1 } } },
      ]),
    ]);

    const total = counts.reduce((s, c) => s + c.count, 0);
    const active = counts.find((c) => c._id === "active")?.count ?? 0;
    const archived = counts.find((c) => c._id === "archived")?.count ?? 0;

    const idToString = (id: unknown): string | null =>
      id == null ? null : typeof id === "string" ? id : (id as { toString(): string }).toString();
    const categoryIds = [...new Set(byCategory.map((b) => idToString(b._id)).filter(Boolean))] as string[];

    let nameById = new Map<string, string>();
    if (categoryIds.length > 0) {
      const categories = await Category.find({ _id: { $in: categoryIds } }).lean();
      nameById = new Map(
        categories.map((c: { _id: unknown; name: string }) => {
          const cid = idToString(c._id);
          return [cid ?? "", c.name];
        })
      );
    }

    const categoryList = byCategory.map((b) => {
      const cid = idToString(b._id);
      return {
        categoryId: cid,
        categoryName: cid ? (nameById.get(cid) ?? "Uncategorized") : "Uncategorized",
        count: b.count,
      };
    });

    return { total, active, archived, byCategory: categoryList };
  } catch {
    return empty;
  }
}
