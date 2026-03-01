import { Router } from "express";
import { healthRouter } from "./health";
import { notifyRouter } from "./notify";

const router = Router();

router.use("/health", healthRouter);
router.use("/notify", notifyRouter);

export default router;