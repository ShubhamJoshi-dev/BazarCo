import { User } from "../models/user.model";

export async function findByEmail(email: string) {
  return User.findOne({ email: email.toLowerCase().trim() });
}

export async function findByEmailWithPassword(email: string) {
  return User.findOne({ email: email.toLowerCase().trim() }).select("+password");
}

export async function findById(id: string) {
  return User.findById(id);
}

export async function createUser(data: {
  email: string;
  password: string;
  name?: string;
  role?: "buyer" | "seller";
}) {
  const user = new User({
    email: data.email.toLowerCase().trim(),
    password: data.password,
    name: data.name?.trim(),
    role: data.role ?? "buyer",
  });
  return user.save();
}

export async function updateUserName(userId: string, name: string) {
  return User.findByIdAndUpdate(
    userId,
    { name: name.trim().slice(0, 100) },
    { new: true }
  );
}

export async function setResetToken(
  userId: string,
  token: string,
  expiresAt: Date
) {
  return User.findByIdAndUpdate(userId, {
    resetPasswordToken: token,
    resetPasswordExpires: expiresAt,
  });
}

export async function findByResetToken(token: string) {
  return User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() },
  }).select("+password +resetPasswordToken +resetPasswordExpires");
}

export async function clearResetTokenAndSetPassword(userId: string, hashedPassword: string) {
  return User.findByIdAndUpdate(userId, {
    password: hashedPassword,
    resetPasswordToken: undefined,
    resetPasswordExpires: undefined,
  });
}
