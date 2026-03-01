import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { listOrders, createOrder, updateOrderStatus } from "../controllers/orderController";

export const ordersRouter = Router();

ordersRouter.use(requireAuth);
ordersRouter.get("/", listOrders);
ordersRouter.post("/", createOrder);
ordersRouter.patch("/:id/status", updateOrderStatus);
