import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import * as chatController from "../controllers/chatController";

const router = Router();

router.use(requireAuth);

router.get("/conversations", chatController.listConversations);
router.post("/conversations", chatController.createConversation);
router.get("/conversations/:id", chatController.getConversation);
router.get("/conversations/:id/messages", chatController.getMessages);
router.patch("/messages/:messageId/unsend", chatController.unsendMessage);

export const chatRouter = router;
