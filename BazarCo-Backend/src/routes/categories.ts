import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { listCategories, createCategory, deleteCategory } from "../controllers/categoryController";

export const categoriesRouter = Router();

categoriesRouter.get("/", listCategories);
categoriesRouter.use(requireAuth);
categoriesRouter.post("/", createCategory);
categoriesRouter.delete("/:id", deleteCategory);
