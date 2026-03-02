import type { Request, Response } from "express";
import { errorResponse, successResponse } from "../helpers/response.helper";
import * as addressRepo from "../repositories/address.repository";

type ReqWithUser = Request & { user?: { id: string } };

function trimStr(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function listAddresses(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const docs = await addressRepo.listByUserId(user.id);
  const list = docs.map((d) => {
    const doc = d as Record<string, unknown> & { _id: { toString(): string }; userId: unknown };
    return {
      id: doc._id.toString(),
      userId: doc.userId?.toString?.() ?? doc.userId,
      label: doc.label,
      line1: doc.line1,
      line2: doc.line2,
      city: doc.city,
      state: doc.state,
      zip: doc.zip,
      country: doc.country,
      phone: doc.phone,
      isDefault: doc.isDefault,
    };
  });
  successResponse(res, 200, "Addresses", { addresses: list });
}

export async function createAddress(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const body = req.body as Record<string, unknown>;
  const line1 = trimStr(body.line1);
  const city = trimStr(body.city);
  const country = trimStr(body.country);
  if (!line1 || !city || !country) {
    errorResponse(res, 400, "line1, city, and country are required");
    return;
  }
  const doc = await addressRepo.create(user.id, {
    label: trimStr(body.label) || "Shipping",
    line1,
    line2: trimStr(body.line2),
    city,
    state: trimStr(body.state),
    zip: trimStr(body.zip),
    country,
    phone: trimStr(body.phone),
    isDefault: body.isDefault === true,
  });
  const d = doc as Record<string, unknown> & { _id: { toString(): string }; userId: unknown };
  successResponse(res, 201, "Address created", {
    address: {
      id: d._id.toString(),
      userId: d.userId?.toString?.() ?? d.userId,
      label: d.label,
      line1: d.line1,
      line2: d.line2,
      city: d.city,
      state: d.state,
      zip: d.zip,
      country: d.country,
      phone: d.phone,
      isDefault: d.isDefault,
    },
  });
}

export async function updateAddress(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const id = req.params.id;
  const body = req.body as Record<string, unknown>;
  const updates: { label?: string; line1?: string; line2?: string; city?: string; state?: string; zip?: string; country?: string; phone?: string; isDefault?: boolean } = {};
  if (body.label !== undefined) updates.label = trimStr(body.label) || "Shipping";
  if (body.line1 !== undefined) updates.line1 = trimStr(body.line1);
  if (body.line2 !== undefined) updates.line2 = trimStr(body.line2);
  if (body.city !== undefined) updates.city = trimStr(body.city);
  if (body.state !== undefined) updates.state = trimStr(body.state);
  if (body.zip !== undefined) updates.zip = trimStr(body.zip);
  if (body.country !== undefined) updates.country = trimStr(body.country);
  if (body.phone !== undefined) updates.phone = trimStr(body.phone);
  if (body.isDefault !== undefined) updates.isDefault = body.isDefault === true;
  const doc = await addressRepo.update(id, user.id, updates);
  if (!doc) {
    errorResponse(res, 404, "Address not found");
    return;
  }
  const d = doc as Record<string, unknown> & { _id: { toString(): string }; userId: unknown };
  successResponse(res, 200, "Address updated", {
    address: {
      id: d._id.toString(),
      userId: d.userId?.toString?.() ?? d.userId,
      label: d.label,
      line1: d.line1,
      line2: d.line2,
      city: d.city,
      state: d.state,
      zip: d.zip,
      country: d.country,
      phone: d.phone,
      isDefault: d.isDefault,
    },
  });
}

export async function deleteAddress(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const id = req.params.id;
  const removed = await addressRepo.remove(id, user.id);
  if (!removed) {
    errorResponse(res, 404, "Address not found");
    return;
  }
  successResponse(res, 200, "Address deleted");
}
