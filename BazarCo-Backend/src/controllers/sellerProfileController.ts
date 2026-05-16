import type { Request, Response } from "express";
import { errorResponse, successResponse } from "../helpers/response.helper";
import * as profileRepo from "../repositories/sellerProfile.repository";

type ReqWithUser = Request & { user?: { id: string } };

export async function getProfile(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  try {
    const profile = await profileRepo.getSellerProfileData(user.id);
    if (!profile) {
      errorResponse(res, 404, "Profile not found");
      return;
    }
    successResponse(res, 200, "Profile loaded", { profile });
  } catch (err) {
    console.error("Seller profile get error:", err);
    errorResponse(res, 500, "Failed to load profile");
  }
}

export async function patchProfile(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const body = req.body as Record<string, unknown>;
  const str = (k: string) => (typeof body[k] === "string" ? body[k].trim() : undefined);

  try {
    const profile = await profileRepo.updateSellerProfile(user.id, {
      name: str("name"),
      shopTagline: str("shopTagline"),
      shopDisplayName: str("shopDisplayName"),
      businessName: str("businessName"),
      panVat: str("panVat"),
      businessAddress: str("businessAddress"),
      phone: str("phone"),
      locationLabel: str("locationLabel"),
    });
    if (!profile) {
      errorResponse(res, 404, "Profile not found");
      return;
    }
    successResponse(res, 200, "Profile updated", { profile });
  } catch (err) {
    console.error("Seller profile patch error:", err);
    errorResponse(res, 500, "Failed to update profile");
  }
}

export async function deactivateShop(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  try {
    const ok = await profileRepo.deactivateSellerShop(user.id);
    if (!ok) {
      errorResponse(res, 404, "Profile not found");
      return;
    }
    successResponse(res, 200, "Shop deactivated");
  } catch (err) {
    console.error("Seller deactivate error:", err);
    errorResponse(res, 500, "Failed to deactivate shop");
  }
}
