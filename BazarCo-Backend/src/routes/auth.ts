import { Router } from "express";
import {
  getMe,
  patchProfile,
  postSignup,
  postLogin,
  postDevLogin,
  postForgotPassword,
  postResetPassword,
} from "../controllers/authController";
import { requireAuth } from "../middleware/auth.middleware";

export const authRouter = Router();

authRouter.post("/signup", postSignup);
authRouter.post("/login", postLogin);
authRouter.post("/dev-login", postDevLogin);
authRouter.post("/forgot-password", postForgotPassword);
authRouter.post("/reset-password", postResetPassword);

authRouter.get("/me", requireAuth, getMe);
authRouter.patch("/profile", requireAuth, patchProfile);
