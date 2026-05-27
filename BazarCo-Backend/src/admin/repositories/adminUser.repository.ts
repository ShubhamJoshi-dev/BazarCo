import { AdminUser } from "../models/adminUser.model";

export async function findByUsername(username: string) {
  return AdminUser.findOne({
    username: username.toLowerCase().trim(),
    deletedAt: null,
    isActive: true,
  });
}

export async function findByUsernameWithPassword(username: string) {
  return AdminUser.findOne({
    username: username.toLowerCase().trim(),
    deletedAt: null,
    isActive: true,
  }).select("+password +twoFactorSecret");
}

export async function findById(id: string) {
  return AdminUser.findOne({ _id: id, deletedAt: null });
}

export async function findByIdWithPassword(id: string) {
  return AdminUser.findOne({ _id: id, deletedAt: null }).select("+password");
}

export async function upsertAdmin(data: {
  username: string;
  email: string;
  password: string;
  name: string;
  role: "super_admin" | "admin" | "moderator" | "support";
}) {
  const username = data.username.toLowerCase().trim();
  const email = data.email.toLowerCase().trim();
  const existing = await AdminUser.findOne({ username });
  if (existing) {
    return AdminUser.findByIdAndUpdate(
      existing._id,
      {
        email,
        password: data.password,
        name: data.name,
        role: data.role,
        isActive: true,
        deletedAt: null,
      },
      { new: true }
    );
  }
  return AdminUser.create({
    username,
    email,
    password: data.password,
    name: data.name,
    role: data.role,
  });
}

export async function recordLogin(
  adminId: string,
  meta: { ip?: string; userAgent?: string }
) {
  const entry = { ip: meta.ip, userAgent: meta.userAgent, at: new Date() };
  return AdminUser.findByIdAndUpdate(
    adminId,
    {
      lastLoginAt: new Date(),
      $push: { loginHistory: { $each: [entry], $position: 0, $slice: 20 } },
    },
    { new: true }
  );
}

export async function incrementTokenVersion(adminId: string) {
  return AdminUser.findByIdAndUpdate(adminId, { $inc: { tokenVersion: 1 } }, { new: true });
}
