import { Router } from "express";
import { healthRouter } from "./health";
import { notifyRouter } from "./notify";

const router = Router();

router.use("/api/v1/health", healthRouter);
router.use("/api/v1/notify", notifyRouter);

export default router;