import type { Request, Response } from "express";
import { errorResponse, successResponse } from "../helpers/response.helper";
import { uploadImage, isCloudinaryConfigured } from "../services/cloudinary.service";
import * as settingsRepo from "../repositories/sellerSettings.repository";

type ReqWithUser = Request & { user?: { id: string } };

export async function getSettings(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  try {
    const settings = await settingsRepo.getSellerSettings(user.id);
    if (!settings) {
      errorResponse(res, 404, "Settings not found");
      return;
    }
    successResponse(res, 200, "Settings loaded", { settings });
  } catch (err) {
    console.error("Seller settings get error:", err);
    errorResponse(res, 500, "Failed to load settings");
  }
}

export async function patchSettings(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const body = req.body as Record<string, unknown>;
  const bool = (k: string) => (typeof body[k] === "boolean" ? body[k] : undefined);
  const str = (k: string) => (typeof body[k] === "string" ? body[k].trim() : undefined);

  try {
    const settings = await settingsRepo.updateSellerSettings(user.id, {
      shopDisplayName: str("shopDisplayName"),
      phone: str("phone"),
      shopLogoUrl: str("shopLogoUrl"),
      notifyOrderUpdates: bool("notifyOrderUpdates"),
      notifyInventoryAlerts: bool("notifyInventoryAlerts"),
      notifyMarketing: bool("notifyMarketing"),
      shippingStandardHub: bool("shippingStandardHub"),
      shippingDoorstep: bool("shippingDoorstep"),
    });
    if (!settings) {
      errorResponse(res, 404, "Settings not found");
      return;
    }
    successResponse(res, 200, "Settings updated", { settings });
  } catch (err) {
    console.error("Seller settings patch error:", err);
    errorResponse(res, 500, "Failed to update settings");
  }
}

export async function uploadLogo(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const file = req.file as Express.Multer.File | undefined;
  if (!file?.buffer) {
    errorResponse(res, 400, "Image file required");
    return;
  }
  if (!isCloudinaryConfigured()) {
    errorResponse(res, 503, "Image upload is not configured");
    return;
  }
  try {
    const url = await uploadImage(file.buffer, "bazarco/sellers");
    if (!url) {
      errorResponse(res, 500, "Upload failed");
      return;
    }
    await settingsRepo.setSellerLogo(user.id, url);
    successResponse(res, 200, "Logo updated", { shopLogoUrl: url });
  } catch (err) {
    console.error("Seller logo upload error:", err);
    errorResponse(res, 500, "Failed to upload logo");
  }
}
