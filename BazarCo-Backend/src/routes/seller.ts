import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireSeller } from "../middleware/seller.middleware";
import { getReport } from "../controllers/sellerReportController";
import { getDashboard } from "../controllers/sellerDashboardController";
import { getAnalytics } from "../controllers/sellerAnalyticsController";
import { deactivateShop, getProfile, patchProfile } from "../controllers/sellerProfileController";
import { download, generate, getHub, regenerate } from "../controllers/sellerReportsController";
import { getSettings, patchSettings, uploadLogo } from "../controllers/sellerSettingsController";
import { uploadSingleImage, uploadSingleVideo } from "../config/multer";
import {
  deleteVideoHandler,
  getInsights,
  getVideo,
  listVideos,
  patchVideo,
  publishVideo,
  uploadVideoHandler,
} from "../controllers/sellerVideoController";

export const sellerRouter = Router();

sellerRouter.use(requireAuth);
sellerRouter.get("/settings", requireSeller, getSettings);
sellerRouter.patch("/settings", requireSeller, patchSettings);
sellerRouter.post("/settings/logo", requireSeller, (req, res, next) => {
  uploadSingleImage(req, res, (e) => {
    if (e) {
      res.status(400).json({ status: "error", message: e instanceof Error ? e.message : "Invalid file" });
      return;
    }
    next();
  });
}, uploadLogo);
sellerRouter.get("/dashboard", requireSeller, getDashboard);
sellerRouter.get("/analytics", requireSeller, getAnalytics);
sellerRouter.get("/profile", requireSeller, getProfile);
sellerRouter.patch("/profile", requireSeller, patchProfile);
sellerRouter.post("/profile/deactivate", requireSeller, deactivateShop);
sellerRouter.get("/reports", requireSeller, getHub);
sellerRouter.post("/reports/generate", requireSeller, generate);
sellerRouter.get("/reports/:id/download", requireSeller, download);
sellerRouter.post("/reports/:id/regenerate", requireSeller, regenerate);
sellerRouter.get("/report", requireSeller, getReport);
sellerRouter.get("/videos", requireSeller, listVideos);
sellerRouter.get("/videos/insights", requireSeller, getInsights);
sellerRouter.get("/videos/:id", requireSeller, getVideo);
sellerRouter.post("/videos/upload", requireSeller, (req, res, next) => {
  uploadSingleVideo(req, res, (e) => {
    if (e) {
      res.status(400).json({ status: "error", message: e instanceof Error ? e.message : "Invalid file" });
      return;
    }
    next();
  });
}, uploadVideoHandler);
sellerRouter.patch("/videos/:id", requireSeller, patchVideo);
sellerRouter.post("/videos/:id/publish", requireSeller, publishVideo);
sellerRouter.delete("/videos/:id", requireSeller, deleteVideoHandler);
