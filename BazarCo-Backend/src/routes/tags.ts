import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { listTags, createTag, deleteTag } from "../controllers/tagController";

export const tagsRouter = Router();

tagsRouter.get("/", listTags);
tagsRouter.use(requireAuth);
tagsRouter.post("/", createTag);
tagsRouter.delete("/:id", deleteTag);
