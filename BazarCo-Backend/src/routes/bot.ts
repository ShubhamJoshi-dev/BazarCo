import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { chat } from "../controllers/botController";

export const botRouter = Router();

botRouter.use(requireAuth);
botRouter.post("/chat", chat);
