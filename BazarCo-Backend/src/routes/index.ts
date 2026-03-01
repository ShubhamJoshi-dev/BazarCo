import { Router } from "express";
import { authRouter } from "./auth";
import { categoriesRouter } from "./categories";
import { favouritesRouter } from "./favourites";
import { healthRouter } from "./health";
import { notifyRouter } from "./notify";
import { productsRouter } from "./products";
import { tagsRouter } from "./tags";

const router = Router();

router.use("/auth", authRouter);
router.use("/categories", categoriesRouter);
router.use("/favourites", favouritesRouter);
router.use("/health", healthRouter);
router.use("/notify", notifyRouter);
router.use("/products", productsRouter);
router.use("/tags", tagsRouter);

export default router;