import type { Types } from "mongoose";
import { User } from "../models/user.model";
import { Product } from "../models/product.model";
import { Review } from "../models/review.model";
import { Order } from "../models/order.model";

export interface SellerProfileBadge {
  id: string;
  label: string;
  tone: "green" | "blue" | "amber" | "violet";
}

export interface SellerProfileData {
  id: string;
  email: string;
  name?: string;
  shopTagline: string;
  shopDisplayName: string;
  shopLogoUrl: string;
  businessName: string;
  panVat: string;
  businessAddress: string;
  phone: string;
  locationLabel: string;
  kycVerified: boolean;
  shopActive: boolean;
  memberSinceYear: number;
  rating: number;
  ratingCount: number;
  ratingDistribution: { stars: number; percent: number }[];
  badges: SellerProfileBadge[];
  performance: {
    orderFulfillment: number;
    responseRate: number;
    productQuality: number;
  };
}

export interface SellerProfileUpdateInput {
  name?: string;
  shopTagline?: string;
  shopDisplayName?: string;
  businessName?: string;
  panVat?: string;
  businessAddress?: string;
  phone?: string;
  locationLabel?: string;
}

function syntheticDistribution(avg: number, count: number): { stars: number; percent: number }[] {
  if (count <= 0 || avg <= 0) {
    return [5, 4, 3, 2, 1].map((stars) => ({ stars, percent: stars === 5 ? 100 : 0 }));
  }
  const weights = [1, 2, 3, 4, 5].map((stars) => {
    const dist = Math.abs(stars - avg);
    return Math.max(0.05, 1.2 - dist * 0.35);
  });
  const sum = weights.reduce((a, b) => a + b, 0);
  return [5, 4, 3, 2, 1].map((stars, i) => ({
    stars,
    percent: Math.round((weights[4 - i]! / sum) * 1000) / 10,
  }));
}

export async function getSellerProfileData(sellerId: string): Promise<SellerProfileData | null> {
  const user = await User.findById(sellerId).lean();
  if (!user) return null;

  const doc = user as Record<string, unknown> & {
    _id: Types.ObjectId;
    email: string;
    name?: string;
    shopTagline?: string;
    shopDisplayName?: string;
    shopLogoUrl?: string;
    businessName?: string;
    panVat?: string;
    businessAddress?: string;
    phone?: string;
    locationLabel?: string;
    kycVerified?: boolean;
    shopActive?: boolean;
    rating?: number;
    ratingCount?: number;
    createdAt?: Date;
  };

  const productIds = await Product.find({ sellerId }).select("_id").lean();
  const pids = productIds.map((p) => (p as { _id: Types.ObjectId })._id);

  const [reviewAgg, orderStats] = await Promise.all([
    pids.length
      ? Review.aggregate<{ _id: number; count: number }>([
          { $match: { productId: { $in: pids }, parentId: null, rating: { $gte: 1, $lte: 5 } } },
          { $group: { _id: "$rating", count: { $sum: 1 } } },
        ])
      : Promise.resolve([]),
    Order.aggregate<{ _id: string; count: number }>([
      { $match: { sellerId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  let rating = doc.rating ?? 0;
  let ratingCount = doc.ratingCount ?? 0;
  const distMap = new Map<number, number>();
  let reviewTotal = 0;
  for (const row of reviewAgg) {
    distMap.set(row._id, row.count);
    reviewTotal += row.count;
  }
  if (reviewTotal > 0) {
    ratingCount = reviewTotal;
    let weighted = 0;
    for (const [stars, count] of distMap) weighted += stars * count;
    rating = Math.round((weighted / reviewTotal) * 10) / 10;
  }

  const ratingDistribution =
    reviewTotal > 0
      ? [5, 4, 3, 2, 1].map((stars) => ({
          stars,
          percent: Math.round(((distMap.get(stars) ?? 0) / reviewTotal) * 1000) / 10,
        }))
      : syntheticDistribution(rating, ratingCount);

  const statusCounts = new Map(orderStats.map((s) => [s._id, s.count]));
  const totalOrders = [...statusCounts.values()].reduce((a, b) => a + b, 0);
  const completed = statusCounts.get("completed") ?? 0;
  const cancelled = statusCounts.get("cancelled") ?? 0;
  const inFlight =
    (statusCounts.get("pending") ?? 0) +
    (statusCounts.get("paid") ?? 0) +
    (statusCounts.get("in_progress") ?? 0);
  const fulfillmentDenom = completed + inFlight + cancelled;
  const orderFulfillment =
    fulfillmentDenom > 0 ? Math.round((completed / fulfillmentDenom) * 1000) / 10 : 0;

  const memberYear = doc.createdAt ? new Date(doc.createdAt).getFullYear() : new Date().getFullYear();
  const yearsMember = new Date().getFullYear() - memberYear + 1;

  const badges: SellerProfileBadge[] = [];
  if (orderFulfillment >= 85 || completed >= 10) {
    badges.push({ id: "fast-ship", label: "Fast Shipper", tone: "green" });
  }
  if (rating >= 4.5 && ratingCount >= 5) {
    badges.push({ id: "top-rated", label: "Top Rated Seller", tone: "blue" });
  }
  if (yearsMember >= 1) {
    badges.push({
      id: "member",
      label: yearsMember === 1 ? "1 Year Member" : `${yearsMember} Year Member`,
      tone: "amber",
    });
  }
  if (doc.kycVerified) {
    badges.push({ id: "response", label: "Excellent Response", tone: "violet" });
  }

  const displayName = doc.shopDisplayName?.trim() || doc.name?.trim() || doc.email.split("@")[0];

  return {
    id: doc._id.toString(),
    email: doc.email,
    name: doc.name,
    shopTagline: doc.shopTagline?.trim() || "SHOP SAFE WORK",
    shopDisplayName: displayName,
    shopLogoUrl: doc.shopLogoUrl?.trim() || "",
    businessName: doc.businessName?.trim() || displayName,
    panVat: doc.panVat?.trim() || "—",
    businessAddress: doc.businessAddress?.trim() || doc.locationLabel?.trim() || "—",
    phone: doc.phone?.trim() || "—",
    locationLabel: doc.locationLabel?.trim() || "Nepal",
    kycVerified: !!doc.kycVerified,
    shopActive: doc.shopActive !== false,
    memberSinceYear: memberYear,
    rating,
    ratingCount,
    ratingDistribution,
    badges,
    performance: {
      orderFulfillment,
      responseRate: doc.kycVerified ? 94.5 : 84.5,
      productQuality: rating > 0 ? rating : 4.8,
    },
  };
}

export async function updateSellerProfile(
  sellerId: string,
  input: SellerProfileUpdateInput
): Promise<SellerProfileData | null> {
  const update: Record<string, unknown> = {};
  if (input.name !== undefined) update.name = input.name.trim().slice(0, 100);
  if (input.shopTagline !== undefined) update.shopTagline = input.shopTagline.trim().slice(0, 80);
  if (input.shopDisplayName !== undefined) update.shopDisplayName = input.shopDisplayName.trim().slice(0, 120);
  if (input.businessName !== undefined) update.businessName = input.businessName.trim().slice(0, 200);
  if (input.panVat !== undefined) update.panVat = input.panVat.trim().slice(0, 64);
  if (input.businessAddress !== undefined) update.businessAddress = input.businessAddress.trim().slice(0, 500);
  if (input.phone !== undefined) update.phone = input.phone.trim().slice(0, 32);
  if (input.locationLabel !== undefined) update.locationLabel = input.locationLabel.trim().slice(0, 200);

  if (Object.keys(update).length > 0) {
    await User.findByIdAndUpdate(sellerId, { $set: update });
  }
  return getSellerProfileData(sellerId);
}

export async function deactivateSellerShop(sellerId: string): Promise<boolean> {
  const updated = await User.findByIdAndUpdate(sellerId, { shopActive: false }, { new: true });
  return !!updated;
}
