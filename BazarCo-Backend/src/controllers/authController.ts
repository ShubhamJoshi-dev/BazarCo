import type { Request, Response } from "express";
import { errorResponse, successResponse } from "../helpers/response.helper";
import { validatePasswordStrength } from "../helpers/password.helper";
import { logger } from "../lib/logger";
import * as authService from "../services/auth.service";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseString(body: unknown, key: string): string | null {
  if (typeof body !== "object" || body === null || !(key in body)) return null;
  const v = (body as Record<string, unknown>)[key];
  return typeof v === "string" ? v.trim() : null;
}

function validateEmail(email: string | null): boolean {
  return email !== null && email.length > 0 && EMAIL_REGEX.test(email);
}


export async function postSignup(req: Request, res: Response): Promise<void> {
  const email = parseString(req.body, "email");
  const password = parseString(req.body, "password");
  const name = parseString(req.body, "name");

  if (!validateEmail(email)) {
    errorResponse(res, 400, "Valid email is required");
    return;
  }
  const pwdCheck = validatePasswordStrength(password ?? "");
  if (!pwdCheck.valid) {
    errorResponse(res, 400, pwdCheck.message ?? "Invalid password");
    return;
  }

  try {
    const result = await authService.signup(email!, password!, name ?? undefined);
    if (!result.success) {
      if (result.reason === "email_exists") {
        errorResponse(res, 409, "An account with this email already exists");
        return;
      }
      errorResponse(res, 400, "Signup failed");
      return;
    }
    successResponse(res, 201, "Account created", {
      token: result.token,
      user: result.user,
    });
  } catch (err: unknown) {
    logger.error("Signup error", { err });
    errorResponse(res, 500, "Failed to create account");
  }
}

export async function postLogin(req: Request, res: Response): Promise<void> {
  const email = parseString(req.body, "email");
  const password = parseString(req.body, "password");

  if (!validateEmail(email)) {
    errorResponse(res, 400, "Valid email is required");
    return;
  }
  if (!password || password.length === 0) {
    errorResponse(res, 400, "Password is required");
    return;
  }

  try {
    const result = await authService.login(email!, password);
    if (!result.success) {
      errorResponse(res, 401, "Invalid email or password");
      return;
    }
    successResponse(res, 200, "Signed in", {
      token: result.token,
      user: result.user,
    });
  } catch (err: unknown) {
    logger.error("Login error", { err });
    errorResponse(res, 500, "Sign in failed");
  }
}

export async function postForgotPassword(req: Request, res: Response): Promise<void> {
  const email = parseString(req.body, "email");

  if (!validateEmail(email)) {
    errorResponse(res, 400, "Valid email is required");
    return;
  }

  try {
    await authService.requestPasswordReset(email!);
    successResponse(res, 200, "If an account exists, you will receive a password reset link by email");
  } catch (err: unknown) {
    logger.error("Forgot password error", { err });
    errorResponse(res, 500, "Failed to process request");
  }
}

export async function postDevLogin(req: Request, res: Response): Promise<void> {
  const secret = parseString(req.body, "secret");

  if (!secret || secret.length === 0) {
    errorResponse(res, 400, "Secret is required");
    return;
  }

  try {
    const result = await authService.devLogin(secret);
    if (!result.success) {
      if (result.reason === "not_allowed") {
        errorResponse(res, 403, "Dev login is not allowed");
        return;
      }
      errorResponse(res, 404, "Dev user not found. Run seed:dev.");
      return;
    }
    successResponse(res, 200, "Signed in as dev", {
      token: result.token,
      user: result.user,
    });
  } catch (err: unknown) {
    logger.error("Dev login error", { err });
    errorResponse(res, 500, "Dev login failed");
  }
}

type AuthRequest = Request & { user: { id: string; email: string; name?: string; role: string } };

export async function getMe(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthRequest;
  try {
    const user = await authService.getProfile(authReq.user.id);
    if (!user) {
      errorResponse(res, 404, "User not found");
      return;
    }
    successResponse(res, 200, "OK", { user });
  } catch (err: unknown) {
    logger.error("Get me error", { err });
    errorResponse(res, 500, "Failed to load profile");
  }
}

export async function patchProfile(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthRequest;
  const name = parseString(req.body, "name");
  if (name === null || name === undefined) {
    errorResponse(res, 400, "Name is required");
    return;
  }
  const trimmed = (name as string).trim().slice(0, 100);
  try {
    const user = await authService.updateProfile(authReq.user.id, trimmed);
    if (!user) {
      errorResponse(res, 404, "User not found");
      return;
    }
    successResponse(res, 200, "Profile updated", { user });
  } catch (err: unknown) {
    logger.error("Update profile error", { err });
    errorResponse(res, 500, "Failed to update profile");
  }
}

export async function postResetPassword(req: Request, res: Response): Promise<void> {
  const token = parseString(req.body, "token");
  const password = parseString(req.body, "password");

  if (!token || token.length === 0) {
    errorResponse(res, 400, "Reset token is required");
    return;
  }
  const pwdCheck = validatePasswordStrength(password ?? "");
  if (!pwdCheck.valid) {
    errorResponse(res, 400, pwdCheck.message ?? "Invalid password");
    return;
  }

  try {
    const result = await authService.resetPassword(token, password!);
    if (!result.success) {
      errorResponse(res, 400, "Invalid or expired reset link. Please request a new one.");
      return;
    }
    successResponse(res, 200, "Password has been reset. You can sign in with your new password.");
  } catch (err: unknown) {
    logger.error("Reset password error", { err });
    errorResponse(res, 500, "Failed to reset password");
  }
}
