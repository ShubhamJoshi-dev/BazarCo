import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false },
    name: { type: String, trim: true, maxlength: 100 },
    role: { type: String, enum: ["buyer", "seller"], default: "buyer" },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true, collection: "users" }
);

export const User = mongoose.model("User", userSchema);
