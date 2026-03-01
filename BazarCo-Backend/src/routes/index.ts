import { Router } from "express";
import { authRouter } from "./auth";
import { cartRouter } from "./cart";
import { categoriesRouter } from "./categories";
import { favouritesRouter } from "./favourites";
import { healthRouter } from "./health";
import { notifyRouter } from "./notify";
import { ordersRouter } from "./orders";
import { productsRouter } from "./products";
import { sellerRouter } from "./seller";
import { tagsRouter } from "./tags";

const router = Router();

router.use("/auth", authRouter);
router.use("/cart", cartRouter);
router.use("/categories", categoriesRouter);
router.use("/favourites", favouritesRouter);
router.use("/health", healthRouter);
router.use("/notify", notifyRouter);
router.use("/orders", ordersRouter);
router.use("/products", productsRouter);
router.use("/seller", sellerRouter);
router.use("/tags", tagsRouter);

export default router;