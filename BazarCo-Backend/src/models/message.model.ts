import mongoose from "mongoose";
import { randomUUID } from "crypto";

export type MessageRole = "buyer" | "seller";
export type MessageType = "text" | "image" | "file";
export type MessageStatus = "sent" | "delivered" | "seen";

const messageSchema = new mongoose.Schema(
  {
    messageId: { type: String, required: true, unique: true, default: () => randomUUID() },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["buyer", "seller"], required: true },
    content: { type: String, required: true, default: "" },
    messageType: { type: String, enum: ["text", "image", "file"], default: "text" },
    status: { type: String, enum: ["sent", "delivered", "seen"], default: "sent" },
    isUnsent: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "messages" }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ conversationId: 1, messageId: 1 }, { unique: true });

export const Message = mongoose.model("Message", messageSchema);
