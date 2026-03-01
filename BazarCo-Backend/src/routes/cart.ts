import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { getCart, addToCart, updateCartItem, removeFromCart } from "../controllers/cartController";

export const cartRouter = Router();

cartRouter.use(requireAuth);
cartRouter.get("/", getCart);
cartRouter.post("/", addToCart);
cartRouter.patch("/:productId", updateCartItem);
cartRouter.delete("/:productId", removeFromCart);
