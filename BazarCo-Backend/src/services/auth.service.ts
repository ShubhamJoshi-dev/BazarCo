import bcrypt from "bcrypt";
import crypto from "crypto";
import { env } from "../config/env";
import * as userRepo from "../repositories/user.repository";
import { signToken } from "../lib/jwt";
import * as mailService from "./mail.service";
import type { JwtPayload } from "../interfaces/auth";

const SALT_ROUNDS = 10;

export async function signup(email: string, password: string, name?: string) {
  const existing = await userRepo.findByEmail(email);
  if (existing) {
    return { success: false, reason: "email_exists" as const };
  }
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await userRepo.createUser({ email, password: hashed, name });
  const payload: JwtPayload = { userId: user._id.toString(), email: user.email };
  const token = signToken(payload);
  const role = (user as { role?: string }).role ?? "buyer";
  return {
    success: true,
    token,
    user: { id: user._id.toString(), email: user.email, name: user.name, role },
  };
}

export async function login(email: string, password: string) {
  const user = await userRepo.findByEmailWithPassword(email);
  if (!user) {
    return { success: false, reason: "invalid_credentials" as const };
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return { success: false, reason: "invalid_credentials" as const };
  }
  const payload: JwtPayload = { userId: user._id.toString(), email: user.email };
  const token = signToken(payload);
  const role = (user as { role?: string }).role ?? "buyer";
  return {
    success: true,
    token,
    user: { id: user._id.toString(), email: user.email, name: user.name, role },
  };
}

export async function requestPasswordReset(email: string) {
  const user = await userRepo.findByEmail(email);
  if (!user) {
    return { success: true };
  }
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await userRepo.setResetToken(user._id.toString(), token, expiresAt);
  const base = env.FRONTEND_URL.replace(/\/$/, "");
  const resetLink = `${base}/reset-password?token=${token}`;
  await mailService.sendPasswordResetEmail(user.email, resetLink);
  return { success: true };
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await userRepo.findByResetToken(token);
  if (!user) {
    return { success: false, reason: "invalid_or_expired_token" as const };
  }
  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await userRepo.clearResetTokenAndSetPassword(user._id.toString(), hashed);
  return { success: true };
}

export async function getProfile(userId: string) {
  const user = await userRepo.findById(userId);
  if (!user) return null;
  const role = (user as { role?: string }).role ?? "buyer";
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role,
  };
}

export async function updateProfile(userId: string, name: string) {
  const updated = await userRepo.updateUserName(userId, name);
  if (!updated) return null;
  const role = (updated as { role?: string }).role ?? "buyer";
  return {
    id: updated._id.toString(),
    email: updated.email,
    name: updated.name,
    role,
  };
}

const DEV_USER_EMAIL = "shubhamrajjoshi69@gmail.com";

export async function devLogin(secret: string) {
  if (!env.ALLOW_DEV_LOGIN || secret !== env.DEV_LOGIN_SECRET) {
    return { success: false, reason: "not_allowed" as const };
  }
  const user = await userRepo.findByEmail(DEV_USER_EMAIL);
  if (!user) {
    return { success: false, reason: "no_dev_user" as const };
  }
  const payload: JwtPayload = { userId: user._id.toString(), email: user.email };
  const token = signToken(payload);
  const role = (user as { role?: string }).role ?? "buyer";
  return {
    success: true,
    token,
    user: { id: user._id.toString(), email: user.email, name: user.name, role },
  };
}
