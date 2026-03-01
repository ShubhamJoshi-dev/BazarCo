import type { Request, Response } from "express";
import { errorResponse, successResponse } from "../helpers/response.helper";
import * as tagRepo from "../repositories/tag.repository";

type ReqWithUser = Request & { user?: { id: string; role: string } };

export async function listTags(_req: ReqWithUser, res: Response): Promise<void> {
  const tags = await tagRepo.listTags();
  successResponse(res, 200, "Tags listed", { tags });
}

export async function createTag(req: ReqWithUser, res: Response): Promise<void> {
  if (!req.user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  if (!name || name.length > 60) {
    errorResponse(res, 400, "Name is required (max 60 characters)");
    return;
  }
  const tag = await tagRepo.createTag(name);
  if (!tag) {
    errorResponse(res, 400, "Tag already exists or invalid");
    return;
  }
  successResponse(res, 201, "Tag created", { tag });
}

export async function deleteTag(req: ReqWithUser, res: Response): Promise<void> {
  if (!req.user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const id = req.params.id;
  const deleted = await tagRepo.deleteTag(id);
  if (!deleted) {
    errorResponse(res, 404, "Tag not found");
    return;
  }
  successResponse(res, 200, "Tag deleted");
}
