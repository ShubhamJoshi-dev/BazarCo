"use client";

import { io, type Socket } from "socket.io-client";
import { getBackendBaseUrl } from "@/config/env";
import { getStoredToken } from "./api";

export type ChatMessagePayload = {
  messageId: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  role: "buyer" | "seller";
  content: string;
  messageType: "text" | "image" | "file";
  status: string;
  isUnsent: boolean;
  createdAt: string;
  updatedAt: string;
};

let socketInstance: Socket | null = null;

export function getSocket(): Socket | null {
  return socketInstance;
}

export function connectSocket(): Socket | null {
  const token = getStoredToken();
  if (!token) return null;
  if (socketInstance?.connected) return socketInstance;
  const url = getBackendBaseUrl();
  socketInstance = io(url, {
    auth: { token },
    path: "/socket.io/",
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });
  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

export function joinConversation(conversationId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = getSocket();
    if (!s) {
      reject(new Error("Socket not connected"));
      return;
    }
    s.emit("join_conversation", conversationId, (err: string | null) => {
      if (err) reject(new Error(err ?? "Failed to join"));
      else resolve();
    });
  });
}

export function leaveConversation(conversationId: string): void {
  getSocket()?.emit("leave_conversation", conversationId);
}

export function sendMessage(
  conversationId: string,
  content: string,
  messageType: "text" | "image" | "file" = "text"
): Promise<ChatMessagePayload> {
  return new Promise((resolve, reject) => {
    const s = getSocket();
    if (!s) {
      reject(new Error("Socket not connected"));
      return;
    }
    s.emit("send_message", { conversationId, content, messageType }, (err: string | null, data?: ChatMessagePayload) => {
      if (err) reject(new Error(err ?? "Failed to send"));
      else if (data) resolve(data);
      else reject(new Error("No response"));
    });
  });
}

export function emitTypingStart(conversationId: string): void {
  getSocket()?.emit("typing_start", conversationId);
}

export function emitTypingStop(conversationId: string): void {
  getSocket()?.emit("typing_stop", conversationId);
}

export function emitMarkSeen(conversationId: string): void {
  getSocket()?.emit("mark_seen", conversationId);
}

export function unsendMessage(conversationId: string, messageId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    getSocket()?.emit("unsend_message", { conversationId, messageId }, (err: string | null) => {
      if (err) reject(new Error(err ?? "Failed to unsend"));
      else resolve();
    });
  });
}
