import type { Request, Response } from "express";
import type { Types } from "mongoose";
import { errorResponse, successResponse } from "../helpers/response.helper";
import * as productRepo from "../repositories/product.repository";
import * as categoryRepo from "../repositories/category.repository";
import * as tagRepo from "../repositories/tag.repository";
import * as reviewRepo from "../repositories/review.repository";
import * as reactionRepo from "../repositories/reviewReaction.repository";
import * as likeRepo from "../repositories/like.repository";
import * as userRepo from "../repositories/user.repository";
import { uploadImage, isCloudinaryConfigured } from "../services/cloudinary.service";
import { createShopifyProduct, isShopifyConfigured } from "../services/shopify.service";
import {
  isAlgoliaConfigured,
  indexProduct,
  updateProductInAlgolia,
  deleteProductFromAlgolia,
  searchProducts,
} from "../services/algolia.service";

type AuthUser = { id: string; role: string };
type ReqWithUser = Request & { user?: AuthUser };

function toProductDto(
  doc: Record<string, unknown> & { _id: Types.ObjectId; sellerId: Types.ObjectId },
  opts?: { category?: string; tags?: string[] }
) {
  const categoryId = doc.categoryId != null ? (doc.categoryId as Types.ObjectId).toString() : undefined;
  const tagIds = Array.isArray(doc.tagIds)
    ? (doc.tagIds as Types.ObjectId[]).map((t) => t.toString())
    : [];
  const status = (doc.status as string) ?? "active";
  const stockRaw = doc.stock as number | undefined;
  const stock =
    typeof stockRaw === "number" && !Number.isNaN(stockRaw)
      ? stockRaw
      : status === "archived"
        ? 0
        : 50;
  const sku =
    (typeof doc.sku === "string" && doc.sku.trim()) ||
    `SKU-${doc._id.toString().slice(-6).toUpperCase()}`;
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    price: doc.price,
    sku,
    stock,
    brand: typeof doc.brand === "string" ? doc.brand.trim() : "",
    imageUrl: doc.imageUrl,
    status: doc.status,
    shopifyProductId: doc.shopifyProductId,
    sellerId: doc.sellerId.toString(),
    categoryId: categoryId ?? undefined,
    tagIds,
    ...(opts?.category != null && { category: opts.category }),
    ...(opts?.tags != null && { tags: opts.tags }),
    createdAt: (doc as { createdAt?: Date }).createdAt?.toISOString?.(),
    updatedAt: (doc as { updatedAt?: Date }).updatedAt?.toISOString?.(),
  };
}

export async function listProducts(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const status = typeof req.query.status === "string" && (req.query.status === "active" || req.query.status === "archived")
    ? req.query.status
    : undefined;
  const products = await productRepo.findBySellerId(user.id, status ? { status } : undefined);
  const categoryIds = [
    ...new Set(
      products
        .map((p) => (p as { categoryId?: Types.ObjectId }).categoryId?.toString())
        .filter(Boolean) as string[],
    ),
  ];
  const categoryMap = new Map<string, string>();
  for (const cid of categoryIds) {
    const cat = await categoryRepo.findCategoryById(cid);
    if (cat) categoryMap.set(cid, cat.name);
  }
  successResponse(res, 200, "Products listed", {
    products: products.map((p) => {
      const doc = p as Record<string, unknown> & { _id: Types.ObjectId; sellerId: Types.ObjectId; categoryId?: Types.ObjectId };
      const cid = doc.categoryId?.toString();
      return toProductDto(doc, { category: cid ? categoryMap.get(cid) : undefined });
    }),
  });
}

export async function createProduct(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }

  if (user.role === "seller") {
    const dbUser = await userRepo.findById(user.id);
    const kycVerified = (dbUser as { kycVerified?: boolean })?.kycVerified;
    if (!kycVerified) {
      errorResponse(
        res,
        403,
        "KYC verification required before adding products. Please upload your national card or company card in the KYC section and wait for admin verification."
      );
      return;
    }
  }

  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const description = typeof req.body.description === "string" ? req.body.description.trim() : "";
  const price = Number(req.body.price);
  const categoryId = typeof req.body.categoryId === "string" ? req.body.categoryId.trim() || undefined : undefined;
  const tagIdsRaw = req.body.tagIds;
  const tagIds = Array.isArray(tagIdsRaw)
    ? tagIdsRaw.map((t) => (typeof t === "string" ? t.trim() : "")).filter(Boolean)
    : [];
  if (!name || name.length > 200) {
    errorResponse(res, 400, "Name is required (max 200 characters)");
    return;
  }
  if (Number.isNaN(price) || price < 0) {
    errorResponse(res, 400, "Valid price is required");
    return;
  }
  const sku =
    typeof req.body.sku === "string" && req.body.sku.trim()
      ? req.body.sku.trim().slice(0, 64)
      : `SKU-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const stock =
    typeof req.body.stock !== "undefined"
      ? Math.max(0, Math.floor(Number(req.body.stock)) || 0)
      : 50;
  const brand = typeof req.body.brand === "string" ? req.body.brand.trim().slice(0, 120) : "";

  let categoryName: string | undefined;
  if (categoryId) {
    const cat = await categoryRepo.findCategoryById(categoryId);
    categoryName = cat?.name;
  }
  const tagNames: string[] = [];
  for (const tid of tagIds) {
    const t = await tagRepo.findTagById(tid);
    if (t) tagNames.push(t.name);
  }

  let imageUrl: string | undefined;
  const file = req.file as Express.Multer.File | undefined;
  if (file?.buffer && isCloudinaryConfigured()) {
    imageUrl = (await uploadImage(file.buffer)) ?? undefined;
  }

  let shopifyProductId: string | undefined;
let shopifyVariantId: string | undefined;

if (isShopifyConfigured()) {
  const shopify = await createShopifyProduct({
    title: name,
    descriptionHtml: description
      ? `<p>${description.replace(/</g, "&lt;").replace(/[>]/g, "&gt;")}</p>`
      : "",
  });

  if (shopify) {
    shopifyProductId = shopify.productId;
    shopifyVariantId = shopify.variantId; // 🔹 SAVE VARIANT ID
  }
}

const product = await productRepo.createProduct({
  name,
  description: description || undefined,
  price,
  sku,
  stock,
  brand: brand || undefined,
  imageUrl,
  categoryId: categoryId || undefined,
  tagIds: tagIds.length ? tagIds : undefined,
  shopifyProductId,
  shopifyVariantId,
  sellerId: user.id,
});

  const productDoc = product as Record<string, unknown> & { _id: Types.ObjectId; sellerId: Types.ObjectId };
  if (isAlgoliaConfigured()) {
    await indexProduct({
      objectID: productDoc._id.toString(),
      name,
      description: description || undefined,
      price,
      imageUrl,
      category: categoryName,
      tags: tagNames.length ? tagNames : undefined,
      createdBy: productDoc.sellerId.toString(),
      shopifyProductId,
      shopifyVariantId,
      status: (productDoc.status as string) ?? "active",
    });
  }

  successResponse(res, 201, "Product created", {
    product: toProductDto(productDoc, { category: categoryName, tags: tagNames.length ? tagNames : undefined }),
  });
}

export async function updateProduct(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }

  const id = req.params.id;
  const name = typeof req.body.name === "string" ? req.body.name.trim() : undefined;
  const description = typeof req.body.description === "string" ? req.body.description.trim() : undefined;
  const price = typeof req.body.price !== "undefined" ? Number(req.body.price) : undefined;
  const categoryId = req.body.categoryId !== undefined
    ? (typeof req.body.categoryId === "string" ? req.body.categoryId.trim() || null : null)
    : undefined;
  const tagIdsRaw = req.body.tagIds;
  const tagIds = tagIdsRaw !== undefined
    ? (Array.isArray(tagIdsRaw) ? tagIdsRaw.map((t) => (typeof t === "string" ? t.trim() : "")).filter(Boolean) : [])
    : undefined;

  if (name !== undefined && (!name || name.length > 200)) {
    errorResponse(res, 400, "Name must be 1–200 characters");
    return;
  }
  if (price !== undefined && (Number.isNaN(price) || price < 0)) {
    errorResponse(res, 400, "Price must be a non-negative number");
    return;
  }

  const file = req.file as Express.Multer.File | undefined;
  let imageUrl: string | undefined;
  if (file?.buffer && isCloudinaryConfigured()) {
    imageUrl = (await uploadImage(file.buffer)) ?? undefined;
  }

  const update: {
    name?: string;
    description?: string;
    price?: number;
    sku?: string;
    stock?: number;
    brand?: string;
    imageUrl?: string;
    categoryId?: string | null;
    tagIds?: string[];
  } = {};
  if (name !== undefined) update.name = name;
  if (description !== undefined) update.description = description;
  if (price !== undefined) update.price = price;
  if (typeof req.body.sku === "string") update.sku = req.body.sku.trim().slice(0, 64);
  if (typeof req.body.stock !== "undefined") {
    update.stock = Math.max(0, Math.floor(Number(req.body.stock)) || 0);
  }
  if (typeof req.body.brand === "string") update.brand = req.body.brand.trim().slice(0, 120);
  if (imageUrl !== undefined) update.imageUrl = imageUrl;
  if (categoryId !== undefined) update.categoryId = categoryId;
  if (tagIds !== undefined) update.tagIds = tagIds;

  const product = await productRepo.updateProduct(id, user.id, update);
  if (!product) {
    errorResponse(res, 404, "Product not found");
    return;
  }
  const productDoc = product as Record<string, unknown> & { _id: Types.ObjectId; sellerId: Types.ObjectId };
  let categoryName: string | undefined;
  if (productDoc.categoryId) {
    const cat = await categoryRepo.findCategoryById((productDoc.categoryId as Types.ObjectId).toString());
    categoryName = cat?.name;
  }
  const tagNames: string[] = [];
  if (Array.isArray(productDoc.tagIds)) {
    for (const tid of productDoc.tagIds) {
      const t = await tagRepo.findTagById((tid as Types.ObjectId).toString());
      if (t) tagNames.push(t.name);
    }
  }
  if (isAlgoliaConfigured()) {
    await updateProductInAlgolia(id, {
      name: productDoc.name as string,
      description: productDoc.description as string | undefined,
      price: productDoc.price as number,
      imageUrl: productDoc.imageUrl as string | undefined,
      category: categoryName,
      tags: tagNames.length ? tagNames : undefined,
      createdBy: productDoc.sellerId.toString(),
      shopifyProductId: productDoc.shopifyProductId as string | undefined,
      status: (productDoc.status as string) ?? "active",
    });
  }
  successResponse(res, 200, "Product updated", {
    product: toProductDto(productDoc, { category: categoryName, tags: tagNames.length ? tagNames : undefined }),
  });
}

export async function deleteProduct(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }

  const productId = req.params.id;
  const deleted = await productRepo.deleteProduct(productId, user.id);
  if (!deleted) {
    errorResponse(res, 404, "Product not found");
    return;
  }
  if (isAlgoliaConfigured()) {
    await deleteProductFromAlgolia(productId);
  }
  successResponse(res, 200, "Product deleted");
}

export async function archiveProduct(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }

  const product = await productRepo.updateProduct(req.params.id, user.id, { status: "archived" });
  if (!product) {
    errorResponse(res, 404, "Product not found");
    return;
  }
  if (isAlgoliaConfigured()) {
    await updateProductInAlgolia(req.params.id, { status: "archived" });
  }
  successResponse(res, 200, "Product archived", {
    product: toProductDto(product as Record<string, unknown> & { _id: Types.ObjectId; sellerId: Types.ObjectId }),
  });
}

export async function unarchiveProduct(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }

  const product = await productRepo.updateProduct(req.params.id, user.id, { status: "active" });
  if (!product) {
    errorResponse(res, 404, "Product not found");
    return;
  }
  if (isAlgoliaConfigured()) {
    await updateProductInAlgolia(req.params.id, { status: "active" });
  }
  successResponse(res, 200, "Product unarchived", {
    product: toProductDto(product as Record<string, unknown> & { _id: Types.ObjectId; sellerId: Types.ObjectId }),
  });
}

function toBrowseProductDto(hit: {
  objectID: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category?: string;
  tags?: string[];
  sellerId: string;
}) {
  return {
    id: hit.objectID,
    name: hit.name,
    description: hit.description,
    price: hit.price,
    imageUrl: hit.imageUrl,
    category: hit.category,
    tags: hit.tags ?? [],
    sellerId: hit.sellerId,
    status: "active" as const,
  };
}

export async function browseProducts(req: ReqWithUser, res: Response): Promise<void> {
  if (!req.user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const categoryId = typeof req.query.category === "string" ? req.query.category.trim() || undefined : undefined;
  const tagsParam = req.query.tags;
  const tagIds = typeof tagsParam === "string"
    ? tagsParam.split(",").map((t) => t.trim()).filter(Boolean)
    : Array.isArray(tagsParam)
      ? tagsParam.map((t) => (typeof t === "string" ? t.trim() : "")).filter(Boolean)
      : [];
  const page = Math.max(0, parseInt(String(req.query.page), 10) || 0);
  const limit = Math.min(48, Math.max(12, parseInt(String(req.query.limit), 10) || 24));
  const sortBy = (["newest", "price-asc", "price-desc", "name-asc"] as const).includes(
    req.query.sortBy as "newest" | "price-asc" | "price-desc" | "name-asc"
  ) ? (req.query.sortBy as "newest" | "price-asc" | "price-desc" | "name-asc") : "newest";
  const minPrice = req.query.minPrice ? parseFloat(String(req.query.minPrice)) : undefined;
  const maxPrice = req.query.maxPrice ? parseFloat(String(req.query.maxPrice)) : undefined;

  const categoriesList = await categoryRepo.listCategories();
  const tagsList = await tagRepo.listTags();

  // Only use Algolia when user has typed a search query; otherwise browse shows MongoDB data
  const hasSearchQuery = q.length > 0;
  if (hasSearchQuery && isAlgoliaConfigured()) {
    let categoryName: string | undefined;
    if (categoryId) {
      const cat = await categoryRepo.findCategoryById(categoryId);
      categoryName = cat?.name;
    }
    const tagNames: string[] = [];
    for (const tid of tagIds) {
      const t = await tagRepo.findTagById(tid);
      if (t) tagNames.push(t.name);
    }
    const { hits, nbHits, page: resPage, nbPages } = await searchProducts({
      query: q,
      category: categoryName,
      tags: tagNames.length ? tagNames : undefined,
      page,
      hitsPerPage: limit,
    });
    // If Algolia returns no hits, fallback to MongoDB so search still works (e.g. index not synced)
    if (nbHits > 0) {
      successResponse(res, 200, "Products found", {
        products: hits.map(toBrowseProductDto),
        categories: categoriesList,
        tags: tagsList,
        total: nbHits,
        page: resPage,
        nbPages,
      });
      return;
    }
  }

  // Default browse, Algolia not configured, or Algolia returned 0: show MongoDB data
  const { docs, total } = await productRepo.findActiveForBrowse({
    query: q || undefined,
    categoryId,
    tagIds: tagIds.length ? tagIds : undefined,
    minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
    sortBy,
    limit,
    skip: page * limit,
  });
  const nbPages = Math.ceil(total / limit) || 0;
  const productsWithResolved = await Promise.all(
    docs.map(async (d) => {
      const doc = d as Record<string, unknown> & { _id: Types.ObjectId; sellerId: Types.ObjectId };
      let categoryName: string | undefined;
      if (doc.categoryId) {
        const cat = await categoryRepo.findCategoryById((doc.categoryId as Types.ObjectId).toString());
        categoryName = cat?.name;
      }
      const tagNames: string[] = [];
      if (Array.isArray(doc.tagIds)) {
        for (const tid of doc.tagIds) {
          const t = await tagRepo.findTagById((tid as Types.ObjectId).toString());
          if (t) tagNames.push(t.name);
        }
      }
      return toProductDto(doc, { category: categoryName, tags: tagNames });
    })
  );
  successResponse(res, 200, "Products found", {
    products: productsWithResolved,
    categories: categoriesList,
    tags: tagsList,
    total,
    page,
    nbPages,
  });
}

export async function getProductById(req: ReqWithUser, res: Response): Promise<void> {
  if (!req.user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const id = req.params.id;
  const product = await productRepo.findById(id);
  if (!product) {
    errorResponse(res, 404, "Product not found");
    return;
  }
  const doc = product as Record<string, unknown> & { _id: Types.ObjectId; sellerId: Types.ObjectId; status: string };
  if (doc.status !== "active") {
    errorResponse(res, 404, "Product not found");
    return;
  }
  let categoryName: string | undefined;
  if (doc.categoryId) {
    const cat = await categoryRepo.findCategoryById((doc.categoryId as Types.ObjectId).toString());
    categoryName = cat?.name;
  }
  const tagNames: string[] = [];
  if (Array.isArray(doc.tagIds)) {
    for (const tid of doc.tagIds) {
      const t = await tagRepo.findTagById((tid as Types.ObjectId).toString());
      if (t) tagNames.push(t.name);
    }
  }
  const productDto = toProductDto(doc, { category: categoryName, tags: tagNames });

  const [reviewCount, likeCount, averageRating, userLiked, reviews] = await Promise.all([
    reviewRepo.countByProduct(id),
    likeRepo.countByProduct(id),
    reviewRepo.getAverageRating(id),
    likeRepo.isLikedByUser(id, req.user.id),
    reviewRepo.findByProduct(id),
  ]);

  const rootIds = reviews.map((r) => (r as { _id: Types.ObjectId })._id.toString());
  const [repliesMap, reactionCounts, userReactions] = await Promise.all([
    reviewRepo.findRepliesByParentIds(rootIds),
    reactionRepo.getCountsForMany(rootIds),
    reactionRepo.getUserReactionsForMany(rootIds, req.user.id),
  ]);

  const allAuthorIds = new Set<string>();
  for (const r of reviews) {
    allAuthorIds.add((r as { userId: Types.ObjectId }).userId.toString());
  }
  for (const [, replyList] of repliesMap) {
    for (const rep of replyList as { userId: Types.ObjectId }[]) {
      allAuthorIds.add(rep.userId.toString());
    }
  }
  const replyDocsByParent = new Map<string, { _id: Types.ObjectId; userId: Types.ObjectId; parentId: Types.ObjectId; comment?: string; imageUrls?: string[]; createdAt: Date }[]>();
  for (const [parentId, list] of repliesMap) {
    replyDocsByParent.set(parentId, list as { _id: Types.ObjectId; userId: Types.ObjectId; parentId: Types.ObjectId; comment?: string; imageUrls?: string[]; createdAt: Date }[]);
    for (const rep of list as { userId: Types.ObjectId }[]) {
      allAuthorIds.add(rep.userId.toString());
    }
  }
  const namesByUserId = new Map<string, string>();
  await Promise.all(
    Array.from(allAuthorIds).map(async (uid) => {
      const u = await userRepo.findById(uid);
      const name = (u as { name?: string } | null)?.name ?? (u as { email?: string })?.email ?? "User";
      namesByUserId.set(uid, name);
    })
  );

  const replyIds: string[] = [];
  for (const list of replyDocsByParent.values()) {
    for (const r of list) {
      replyIds.push(r._id.toString());
    }
  }
  const [replyReactionCounts, replyUserReactions] = await Promise.all([
    replyIds.length ? reactionRepo.getCountsForMany(replyIds) : Promise.resolve(new Map()),
    replyIds.length ? reactionRepo.getUserReactionsForMany(replyIds, req.user.id) : Promise.resolve(new Map()),
  ]);

  const reviewsWithUser = reviews.map((r) => {
    const rev = r as Record<string, unknown> & { _id: Types.ObjectId; userId: Types.ObjectId; rating?: number; comment?: string | null; imageUrls?: string[]; createdAt: Date };
    const rid = rev._id.toString();
    const uid = rev.userId.toString();
    const replies = (replyDocsByParent.get(rid) ?? []).map((rep) => {
      const repId = rep._id.toString();
      const repUid = rep.userId.toString();
      const rc = replyReactionCounts.get(repId) ?? { likeCount: 0, dislikeCount: 0 };
      const ur = replyUserReactions.get(repId) ?? null;
      return {
        id: repId,
        userId: repUid,
        userName: namesByUserId.get(repUid) ?? "User",
        parentId: rep.parentId?.toString?.(),
        comment: rep.comment ?? undefined,
        imageUrls: Array.isArray(rep.imageUrls) ? rep.imageUrls : [],
        createdAt: (rep.createdAt as Date).toISOString(),
        likeCount: rc.likeCount,
        dislikeCount: rc.dislikeCount,
        userReaction: ur,
      };
    });
    const counts = reactionCounts.get(rid) ?? { likeCount: 0, dislikeCount: 0 };
    const userReaction = userReactions.get(rid) ?? null;
    return {
      id: rid,
      userId: uid,
      userName: namesByUserId.get(uid) ?? "User",
      rating: rev.rating,
      comment: rev.comment ?? undefined,
      imageUrls: Array.isArray(rev.imageUrls) ? rev.imageUrls : [],
      createdAt: (rev.createdAt as Date).toISOString(),
      likeCount: counts.likeCount,
      dislikeCount: counts.dislikeCount,
      userReaction,
      replies,
    };
  });

  const seller = await userRepo.findById(doc.sellerId.toString());
  const sellerKycVerified = (seller as { kycVerified?: boolean } | null)?.kycVerified ?? false;

  successResponse(res, 200, "Product found", {
    product: productDto,
    reviewCount,
    likeCount,
    averageRating: averageRating ?? 0,
    userLiked,
    reviews: reviewsWithUser,
    sellerKycVerified,
  });
}
