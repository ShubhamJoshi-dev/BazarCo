import { Router } from "express";
import { optionalAuth, requireAuth } from "../middleware/auth.middleware";
import { requireSeller } from "../middleware/seller.middleware";
import { uploadSingleImage } from "../config/multer";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  archiveProduct,
  unarchiveProduct,
  publishProduct,
  browseProducts,
  getProductById,
} from "../controllers/productController";
import { addOrUpdateReview, addReaction, uploadReviewImageHandler } from "../controllers/reviewController";
import { toggleLike } from "../controllers/likeController";
import { listVideoFeed, recordVideoView } from "../controllers/videoFeedController";
import { listVideoComments, createVideoComment } from "../controllers/videoCommentController";

export const productsRouter = Router();

// Public catalogue (optional auth enriches likes/reactions when logged in)
productsRouter.get("/browse", optionalAuth, browseProducts);
productsRouter.get("/videos/feed", optionalAuth, listVideoFeed);
productsRouter.post("/videos/:id/view", optionalAuth, recordVideoView);
productsRouter.get("/videos/:videoId/comments", optionalAuth, listVideoComments);
productsRouter.post("/videos/:videoId/comments", requireAuth, createVideoComment);
productsRouter.get("/:id", optionalAuth, getProductById);

productsRouter.use(requireAuth);
productsRouter.get("/", listProducts);
productsRouter.post("/:id/reviews/upload-image", (req, res, next) => {
  uploadSingleImage(req, res, (e) => {
    if (e) {
      res.status(400).json({ status: "error", message: e instanceof Error ? e.message : "Invalid file" });
      return;
    }
    next();
  });
}, uploadReviewImageHandler);
productsRouter.post("/:id/reviews", addOrUpdateReview);
productsRouter.post("/:id/reviews/:reviewId/reaction", addReaction);
productsRouter.post("/:id/like", toggleLike);
productsRouter.post("/", requireSeller, (req, res, next) => {
  uploadSingleImage(req, res, (e) => {
    if (e) {
      res.status(400).json({ status: "error", message: e instanceof Error ? e.message : "Invalid file" });
      return;
    }
    next();
  });
}, createProduct);
productsRouter.patch("/:id", (req, res, next) => {
  uploadSingleImage(req, res, (e) => {
    if (e) {
      res.status(400).json({ status: "error", message: e instanceof Error ? e.message : "Invalid file" });
      return;
    }
    next();
  });
}, updateProduct);
productsRouter.delete("/:id", deleteProduct);
productsRouter.patch("/:id/archive", archiveProduct);
productsRouter.patch("/:id/unarchive", unarchiveProduct);
productsRouter.patch("/:id/publish", requireSeller, publishProduct);
