import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireSeller } from "../middleware/seller.middleware";
import { uploadKycDocument } from "../config/multer";
import {
  uploadKycDocument as uploadKycDocumentHandler,
  verifyKyc,
  getKycStatus,
  deleteKycDocument,
} from "../controllers/kycController";

export const kycRouter = Router();

kycRouter.get("/verify", verifyKyc);

kycRouter.use(requireAuth);
kycRouter.get("/status", requireSeller, getKycStatus);
kycRouter.delete("/documents/:documentId", requireSeller, deleteKycDocument);
kycRouter.post(
  "/upload",
  requireSeller,
  (req, res, next) => {
    uploadKycDocument(req, res, (e) => {
      if (e) {
        const message = e instanceof Error ? e.message : "Invalid file";
        res.status(400).json({ status: "error", message });
        return;
      }
      next();
    });
  },
  uploadKycDocumentHandler
);
