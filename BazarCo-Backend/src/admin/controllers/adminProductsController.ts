import type { Request, Response } from "express";
import { errorResponse, successResponse } from "../../helpers/response.helper";
import { Product } from "../../models/product.model";
import { Category } from "../../models/category.model";
import { parsePagination, paginationMeta } from "../lib/pagination";
import type { AdminAuthUser } from "../middleware/requireAdminAuth.middleware";
import { logAdminAction } from "../services/audit.service";

function productFilter(query: Record<string, unknown>) {
  const filter: Record<string, unknown> = {};
  if (query.deleted === "true") filter.deletedAt = { $ne: null };
  else if (query.deleted !== "all") filter.deletedAt = null;
  if (query.flagged === "true") filter.flagged = true;
  if (query.status === "draft" || query.status === "active" || query.status === "archived") filter.status = query.status;
  if (typeof query.q === "string" && query.q.trim()) {
    filter.name = new RegExp(query.q.trim(), "i");
  }
  return filter;
}

function serialize(p: Record<string, unknown>) {
  return {
    id: String(p._id),
    name: p.name,
    description: p.description,
    price: p.price,
    status: p.status,
    sellerId: String(p.sellerId),
    stock: p.stock,
    sku: p.sku,
    brand: p.brand,
    imageUrl: p.imageUrl,
    flagged: p.flagged,
    flagReason: p.flagReason,
    featured: p.featured,
    deletedAt: p.deletedAt,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export async function getProduct(req: Request, res: Response): Promise<void> {
  const product = await Product.findById(req.params.id).lean();
  if (!product) {
    errorResponse(res, 404, "Product not found");
    return;
  }
  successResponse(res, 200, "Product", { product: serialize(product as Record<string, unknown>) });
}

export async function listProducts(req: Request, res: Response): Promise<void> {
  const { page, limit, sort, order, skip } = parsePagination(req.query as Record<string, unknown>);
  const filter = productFilter(req.query as Record<string, unknown>);
  const [items, total] = await Promise.all([
    Product.find(filter).sort({ [sort]: order }).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);
  successResponse(res, 200, "Products", {
    products: items.map((p) => serialize(p as Record<string, unknown>)),
    pagination: paginationMeta(total, page, limit),
  });
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { admin: AdminAuthUser }).admin;
  const updates: Record<string, unknown> = {};
  if (typeof req.body.name === "string") updates.name = req.body.name.trim().slice(0, 200);
  if (typeof req.body.price === "number") updates.price = req.body.price;
  if (typeof req.body.stock === "number") updates.stock = req.body.stock;
  if (req.body.status === "draft" || req.body.status === "active" || req.body.status === "archived") updates.status = req.body.status;
  if (typeof req.body.featured === "boolean") updates.featured = req.body.featured;
  const product = await Product.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true }).lean();
  if (!product) {
    errorResponse(res, 404, "Product not found");
    return;
  }
  await logAdminAction({ adminId: admin.id, adminUsername: admin.username, action: "product.update", resource: "product", resourceId: req.params.id });
  successResponse(res, 200, "Product updated", { product: serialize(product as Record<string, unknown>) });
}

export async function flagProduct(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { admin: AdminAuthUser }).admin;
  const flagged = req.body.flagged !== false;
  const flagReason = typeof req.body.flagReason === "string" ? req.body.flagReason.trim().slice(0, 500) : undefined;
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $set: { flagged, flagReason: flagged ? flagReason : undefined } },
    { new: true }
  ).lean();
  if (!product) {
    errorResponse(res, 404, "Product not found");
    return;
  }
  await logAdminAction({ adminId: admin.id, adminUsername: admin.username, action: "product.flag", resource: "product", resourceId: req.params.id });
  successResponse(res, 200, "Product moderation updated", { product: serialize(product as Record<string, unknown>) });
}

export async function softDeleteProduct(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { admin: AdminAuthUser }).admin;
  if (req.body.confirm !== true && req.body.confirm !== "true") {
    errorResponse(res, 400, "Confirmation required (confirm: true)");
    return;
  }
  const product = await Product.findByIdAndUpdate(req.params.id, { $set: { deletedAt: new Date() } }, { new: true }).lean();
  if (!product) {
    errorResponse(res, 404, "Product not found");
    return;
  }
  await logAdminAction({ adminId: admin.id, adminUsername: admin.username, action: "product.soft_delete", resource: "product", resourceId: req.params.id });
  successResponse(res, 200, "Product soft deleted", { product: serialize(product as Record<string, unknown>) });
}

export async function restoreProduct(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { admin: AdminAuthUser }).admin;
  const product = await Product.findByIdAndUpdate(req.params.id, { $set: { deletedAt: null } }, { new: true }).lean();
  if (!product) {
    errorResponse(res, 404, "Product not found");
    return;
  }
  await logAdminAction({ adminId: admin.id, adminUsername: admin.username, action: "product.restore", resource: "product", resourceId: req.params.id });
  successResponse(res, 200, "Product restored", { product: serialize(product as Record<string, unknown>) });
}

export async function bulkModerate(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { admin: AdminAuthUser }).admin;
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  const action = req.body.action;
  if (!ids.length) {
    errorResponse(res, 400, "ids required");
    return;
  }
  let result;
  if (action === "flag") {
    result = await Product.updateMany({ _id: { $in: ids } }, { $set: { flagged: true } });
  } else if (action === "unflag") {
    result = await Product.updateMany({ _id: { $in: ids } }, { $set: { flagged: false, flagReason: undefined } });
  } else if (action === "archive") {
    result = await Product.updateMany({ _id: { $in: ids } }, { $set: { status: "archived" } });
  } else {
    errorResponse(res, 400, "Unsupported action");
    return;
  }
  await logAdminAction({ adminId: admin.id, adminUsername: admin.username, action: `product.bulk.${action}`, metadata: { count: result.modifiedCount } });
  successResponse(res, 200, "Bulk moderation applied", { modified: result.modifiedCount });
}

export async function listCategories(_req: Request, res: Response): Promise<void> {
  const categories = await Category.find({}).sort({ name: 1 }).lean();
  successResponse(res, 200, "Categories", {
    categories: categories.map((c) => ({ id: String(c._id), name: c.name })),
  });
}

export async function setFeatured(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { admin: AdminAuthUser }).admin;
  const featured = req.body.featured === true;
  const product = await Product.findByIdAndUpdate(req.params.id, { $set: { featured } }, { new: true }).lean();
  if (!product) {
    errorResponse(res, 404, "Product not found");
    return;
  }
  await logAdminAction({ adminId: admin.id, adminUsername: admin.username, action: "product.featured", resource: "product", resourceId: req.params.id, metadata: { featured } });
  successResponse(res, 200, "Featured status updated", { product: serialize(product as Record<string, unknown>) });
}
