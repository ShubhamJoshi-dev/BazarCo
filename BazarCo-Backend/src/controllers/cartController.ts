import type { Request, Response } from "express";
import type { Types } from "mongoose";
import { errorResponse, successResponse } from "../helpers/response.helper";
import * as cartRepo from "../repositories/cart.repository";
import * as productRepo from "../repositories/product.repository";
import * as userRepo from "../repositories/user.repository";
import { sendCartAddedEmail } from "../services/mail.service";

type ReqWithUser = Request & { user?: { id: string } };

export async function getCart(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const cart = await cartRepo.getCart(user.id);
  if (!cart || !(cart as { items?: unknown[] }).items?.length) {
    successResponse(res, 200, "Cart", { items: [], total: 0 });
    return;
  }
  const doc = cart as { items: Array<{ productId: Types.ObjectId; quantity: number }> };
  const itemsWithProduct = await Promise.all(
    doc.items.map(async (item) => {
      const product = await productRepo.findById(item.productId.toString());
      if (!product) return null;
      const p = product as Record<string, unknown> & { name: string; price: number; imageUrl?: string };
      return {
        productId: item.productId.toString(),
        quantity: item.quantity,
        name: p.name,
        price: p.price,
        imageUrl: p.imageUrl,
        subtotal: (p.price as number) * item.quantity,
      };
    })
  );
  const items = itemsWithProduct.filter(Boolean);
  const total = items.reduce((sum, i) => sum + (i?.subtotal ?? 0), 0);
  successResponse(res, 200, "Cart", { items, total });
}

export async function addToCart(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const productId = typeof req.body.productId === "string" ? req.body.productId.trim() : undefined;
  const quantity = typeof req.body.quantity === "number" ? Math.max(1, Math.floor(req.body.quantity)) : 1;
  if (!productId) {
    errorResponse(res, 400, "productId is required");
    return;
  }
  const product = await productRepo.findById(productId);
  if (!product) {
    errorResponse(res, 404, "Product not found");
    return;
  }
  const p = product as Record<string, unknown> & { status: string };
  if (p.status !== "active") {
    errorResponse(res, 400, "Product is not available");
    return;
  }
  const productName = (product as Record<string, unknown> & { name: string }).name;
  await cartRepo.addOrUpdateItem(user.id, productId, quantity);
  const cart = await cartRepo.getCart(user.id);
  const doc = cart as { items?: Array<{ productId: Types.ObjectId; quantity: number }> } | null;
  const count = doc?.items?.length ?? 0;

  try {
    const profile = await userRepo.findById(user.id);
    const email = (profile as { email?: string } | null)?.email;
    if (email) {
      await sendCartAddedEmail(email, productName, quantity);
    }
  } catch {
    // Don't fail the request if email fails
  }

  successResponse(res, 200, "Added to cart", { cartItemCount: count, productName });
}

export async function updateCartItem(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const productId = req.params.productId;
  const quantity = typeof req.body.quantity === "number" ? Math.floor(req.body.quantity) : undefined;
  if (quantity === undefined || quantity < 0) {
    errorResponse(res, 400, "quantity is required (0 to remove)");
    return;
  }
  await cartRepo.setItemQuantity(user.id, productId, quantity);
  successResponse(res, 200, "Cart updated");
}

export async function removeFromCart(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const productId = req.params.productId;
  await cartRepo.removeItem(user.id, productId);
  successResponse(res, 200, "Removed from cart");
}
