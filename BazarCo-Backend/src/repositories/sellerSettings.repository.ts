import type { Types } from "mongoose";
import { User } from "../models/user.model";

export interface SellerSettingsData {
  email: string;
  shopDisplayName: string;
  phone: string;
  shopLogoUrl: string;
  notifications: {
    orderUpdates: boolean;
    inventoryAlerts: boolean;
    marketingInsights: boolean;
  };
  shipping: {
    standardHub: boolean;
    doorstep: boolean;
  };
}

export interface SellerSettingsUpdateInput {
  shopDisplayName?: string;
  phone?: string;
  shopLogoUrl?: string;
  notifyOrderUpdates?: boolean;
  notifyInventoryAlerts?: boolean;
  notifyMarketing?: boolean;
  shippingStandardHub?: boolean;
  shippingDoorstep?: boolean;
}

function mapUser(doc: Record<string, unknown> & {
  email: string;
  shopDisplayName?: string;
  name?: string;
  phone?: string;
  shopLogoUrl?: string;
  notifyOrderUpdates?: boolean;
  notifyInventoryAlerts?: boolean;
  notifyMarketing?: boolean;
  shippingStandardHub?: boolean;
  shippingDoorstep?: boolean;
}): SellerSettingsData {
  const display = doc.shopDisplayName?.trim() || doc.name?.trim() || doc.email.split("@")[0];
  return {
    email: doc.email,
    shopDisplayName: display,
    phone: doc.phone?.trim() || "",
    shopLogoUrl: doc.shopLogoUrl?.trim() || "",
    notifications: {
      orderUpdates: doc.notifyOrderUpdates !== false,
      inventoryAlerts: doc.notifyInventoryAlerts !== false,
      marketingInsights: !!doc.notifyMarketing,
    },
    shipping: {
      standardHub: doc.shippingStandardHub !== false,
      doorstep: !!doc.shippingDoorstep,
    },
  };
}

export async function getSellerSettings(sellerId: string): Promise<SellerSettingsData | null> {
  const user = await User.findById(sellerId).lean();
  if (!user) return null;
  return mapUser(user as Parameters<typeof mapUser>[0]);
}

export async function updateSellerSettings(
  sellerId: string,
  input: SellerSettingsUpdateInput,
): Promise<SellerSettingsData | null> {
  const update: Record<string, unknown> = {};
  if (input.shopDisplayName !== undefined) {
    update.shopDisplayName = input.shopDisplayName.trim().slice(0, 120);
  }
  if (input.phone !== undefined) update.phone = input.phone.trim().slice(0, 32);
  if (input.shopLogoUrl !== undefined) update.shopLogoUrl = input.shopLogoUrl.trim();
  if (input.notifyOrderUpdates !== undefined) update.notifyOrderUpdates = input.notifyOrderUpdates;
  if (input.notifyInventoryAlerts !== undefined) update.notifyInventoryAlerts = input.notifyInventoryAlerts;
  if (input.notifyMarketing !== undefined) update.notifyMarketing = input.notifyMarketing;
  if (input.shippingStandardHub !== undefined) update.shippingStandardHub = input.shippingStandardHub;
  if (input.shippingDoorstep !== undefined) update.shippingDoorstep = input.shippingDoorstep;

  if (Object.keys(update).length > 0) {
    await User.findByIdAndUpdate(sellerId, { $set: update });
  }
  return getSellerSettings(sellerId);
}

export async function setSellerLogo(sellerId: string, logoUrl: string): Promise<string | null> {
  const updated = await User.findByIdAndUpdate(
    sellerId,
    { $set: { shopLogoUrl: logoUrl } },
    { new: true },
  ).lean();
  if (!updated) return null;
  return (updated as { shopLogoUrl?: string }).shopLogoUrl ?? logoUrl;
}
