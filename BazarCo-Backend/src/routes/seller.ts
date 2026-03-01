import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { getReport } from "../controllers/sellerReportController";

export const sellerRouter = Router();

sellerRouter.use(requireAuth);
sellerRouter.get("/report", getReport);
