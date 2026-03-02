import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { createCheckoutSession, confirmCheckoutSuccess } from "../controllers/checkoutController";

export const checkoutRouter = Router();

checkoutRouter.use(requireAuth);
checkoutRouter.post("/create-session", createCheckoutSession);
checkoutRouter.post("/success", confirmCheckoutSuccess);
