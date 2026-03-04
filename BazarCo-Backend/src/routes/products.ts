import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { uploadSingleImage } from "../config/multer";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  archiveProduct,
  unarchiveProduct,
  browseProducts,
  getProductById,
} from "../controllers/productController";
import { addOrUpdateReview } from "../controllers/reviewController";
import { toggleLike } from "../controllers/likeController";
import { addReply, getReplies } from "../controllers/replyController";

export const productsRouter = Router();

productsRouter.use(requireAuth);
productsRouter.get("/browse", browseProducts);
productsRouter.get("/", listProducts);
productsRouter.get("/:id", getProductById);
productsRouter.post("/:id/reviews", addOrUpdateReview);
productsRouter.post("/:id/like", toggleLike);
productsRouter.post("/", (req, res, next) => {
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
productsRouter.post("/reviews/:reviewId/replies", addReply);
productsRouter.get("/reviews/:reviewId/replies", getReplies); productsRouter.patch("/:id/archive", archiveProduct);
productsRouter.patch("/:id/unarchive", unarchiveProduct);
