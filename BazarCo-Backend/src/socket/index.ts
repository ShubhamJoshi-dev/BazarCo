import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { verifyToken } from "../lib/jwt";
import * as userRepo from "../repositories/user.repository";
import * as conversationRepo from "../repositories/conversation.repository";
import * as messageRepo from "../repositories/message.repository";
import { env } from "../config/env";
import { logger } from "../lib/logger";

const CONVERSATION_ROOM_PREFIX = "conversation:";

export function createSocketServer(httpServer: HttpServer): Server {
  const corsOrigins = env.CORS_ORIGIN ? env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean) : [];
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigins.length ? corsOrigins : true,
      credentials: true,
    },
    path: "/socket.io/",
    transports: ["websocket", "polling"],
  });

  if (env.REDIS_URI) {
    try {
      const pubClient = new Redis(env.REDIS_URI);
      const subClient = pubClient.duplicate();
      io.adapter(createAdapter(pubClient, subClient));
      logger.info("Socket.IO Redis adapter attached");
    } catch (err) {
      logger.warn("Socket.IO Redis adapter failed; running single-instance", { err });
    }
  }

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token ?? socket.handshake.headers?.authorization?.replace?.("Bearer ", "");
    if (!token) {
      next(new Error("Authentication required"));
      return;
    }
    const payload = verifyToken(token);
    if (!payload) {
      next(new Error("Invalid or expired token"));
      return;
    }
    const user = await userRepo.findById(payload.userId);
    if (!user) {
      next(new Error("User not found"));
      return;
    }
    const u = user as { _id: { toString(): string }; role?: string };
    socket.data.userId = u._id.toString();
    socket.data.role = u.role ?? "buyer";
    next();
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    const role = socket.data.role as string;

    socket.on("join_conversation", async (conversationId: string, ack?: (err: string | null) => void) => {
      if (!conversationId || typeof conversationId !== "string") {
        ack?.("Invalid conversationId");
        return;
      }
      const conv = await conversationRepo.findById(conversationId);
      if (!conv) {
        ack?.("Conversation not found");
        return;
      }
      if (!conversationRepo.isParticipant(conv, userId)) {
        ack?.("Not allowed to join this conversation");
        return;
      }
      const room = CONVERSATION_ROOM_PREFIX + conversationId;
      await socket.join(room);
      socket.data.lastRoom = room;
      io.to(room).emit("user_online", { userId, role });
      ack?.(null);
    });

    socket.on("leave_conversation", (conversationId: string) => {
      const room = CONVERSATION_ROOM_PREFIX + (conversationId ?? "");
      socket.leave(room);
      io.to(room).emit("user_offline", { userId });
    });

    socket.on("send_message", async (payload: { conversationId: string; content: string; messageType?: string }, ack?: (err: string | null, data?: object) => void) => {
      const convId = payload?.conversationId;
      const content = typeof payload?.content === "string" ? payload.content.trim() : "";
      const messageType = payload?.messageType === "image" || payload?.messageType === "file" ? payload.messageType : "text";
      if (!convId || !content) {
        ack?.("conversationId and content required", undefined);
        return;
      }
      const conv = await conversationRepo.findById(convId);
      if (!conv) {
        ack?.("Conversation not found", undefined);
        return;
      }
      if (!conversationRepo.isParticipant(conv, userId)) {
        ack?.("Not allowed to send in this conversation", undefined);
        return;
      }
      const c = conv as { buyerId: { toString(): string }; sellerId: { toString(): string } };
      const buyerId = c.buyerId?.toString?.() ?? "";
      const sellerId = c.sellerId?.toString?.() ?? "";
      const isBuyer = userId === buyerId;
      const receiverId = isBuyer ? sellerId : buyerId;
      const msgRole = isBuyer ? ("buyer" as const) : ("seller" as const);
      const msg = await messageRepo.create({
        conversationId: convId,
        senderId: userId,
        receiverId,
        role: msgRole,
        content,
        messageType: messageType as "text" | "image" | "file",
      });
      const room = CONVERSATION_ROOM_PREFIX + convId;
      const msgPayload = {
        messageId: (msg as { messageId: string }).messageId,
        conversationId: convId,
        senderId: userId,
        receiverId,
        role: msgRole,
        content: (msg as { content: string }).content,
        messageType,
        status: "sent",
        isUnsent: false,
        createdAt: (msg as { createdAt: Date }).createdAt?.toISOString?.(),
        updatedAt: (msg as { updatedAt: Date }).updatedAt?.toISOString?.(),
      };
      io.to(room).emit("message", msgPayload);
      const sockets = await io.in(room).fetchSockets();
      const receiverInRoom = sockets.some((s) => (s.data.userId as string) === receiverId);
      if (receiverInRoom) {
        await messageRepo.markDelivered(convId, receiverId);
        io.to(room).emit("message_status", { messageId: msgPayload.messageId, status: "delivered" });
      }
      ack?.(null, msgPayload);
    });

    socket.on("typing_start", async (conversationId: string) => {
      if (!conversationId) return;
      const conv = await conversationRepo.findById(conversationId);
      if (!conv || !conversationRepo.isParticipant(conv, userId)) return;
      const room = CONVERSATION_ROOM_PREFIX + conversationId;
      socket.to(room).emit("typing", { userId, role });
    });

    socket.on("typing_stop", async (conversationId: string) => {
      if (!conversationId) return;
      const room = CONVERSATION_ROOM_PREFIX + conversationId;
      socket.to(room).emit("typing_stop", { userId });
    });

    socket.on("mark_seen", async (conversationId: string) => {
      if (!conversationId) return;
      const conv = await conversationRepo.findById(conversationId);
      if (!conv || !conversationRepo.isParticipant(conv, userId)) return;
      await messageRepo.markSeen(conversationId, userId);
      const room = CONVERSATION_ROOM_PREFIX + conversationId;
      io.to(room).emit("messages_seen", { userId, conversationId });
    });

    socket.on("unsend_message", async (payload: { conversationId: string; messageId: string }, ack?: (err: string | null) => void) => {
      const messageId = payload?.messageId;
      const conversationId = payload?.conversationId;
      if (!messageId) {
        ack?.("messageId required");
        return;
      }
      const result = await messageRepo.unsend(messageId, userId, env.UNSEND_MESSAGE_WINDOW_MINUTES);
      if (!result.success) {
        ack?.("Cannot unsend (not found, not yours, or outside time window)");
        return;
      }
      const room = conversationId ? CONVERSATION_ROOM_PREFIX + conversationId : null;
      if (room) {
        io.to(room).emit("message_unsent", {
          messageId,
          content: "This message was unsent",
          isUnsent: true,
        });
      }
      ack?.(null);
    });

    socket.on("disconnect", () => {
      const rooms = Array.from(socket.rooms).filter((r) => r.startsWith(CONVERSATION_ROOM_PREFIX));
      for (const room of rooms) {
        socket.to(room).emit("user_offline", { userId });
      }
    });
  });

  return io;
}
