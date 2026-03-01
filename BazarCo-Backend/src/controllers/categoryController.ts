import type { Request, Response } from "express";
import { errorResponse, successResponse } from "../helpers/response.helper";
import * as categoryRepo from "../repositories/category.repository";

type ReqWithUser = Request & { user?: { id: string; role: string } };

export async function listCategories(_req: ReqWithUser, res: Response): Promise<void> {
  const categories = await categoryRepo.listCategories();
  successResponse(res, 200, "Categories listed", { categories });
}

export async function createCategory(req: ReqWithUser, res: Response): Promise<void> {
  if (!req.user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  if (!name || name.length > 80) {
    errorResponse(res, 400, "Name is required (max 80 characters)");
    return;
  }
  const category = await categoryRepo.createCategory(name);
  if (!category) {
    errorResponse(res, 400, "Category already exists or invalid");
    return;
  }
  successResponse(res, 201, "Category created", { category });
}

export async function deleteCategory(req: ReqWithUser, res: Response): Promise<void> {
  if (!req.user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }
  const id = req.params.id;
  const deleted = await categoryRepo.deleteCategory(id);
  if (!deleted) {
    errorResponse(res, 404, "Category not found");
    return;
  }
  successResponse(res, 200, "Category deleted");
}
