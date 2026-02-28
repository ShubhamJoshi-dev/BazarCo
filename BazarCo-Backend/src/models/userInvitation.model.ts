import mongoose from "mongoose";

const userInvitationSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  },
  { timestamps: true, collection: "userInvitation" }
);

export const UserInvitation = mongoose.model("UserInvitation", userInvitationSchema);
