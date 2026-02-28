import { Router } from "express";
import { postNotify } from "../controllers/notifyController";

export const notifyRouter = Router();

notifyRouter.post("/", postNotify);
