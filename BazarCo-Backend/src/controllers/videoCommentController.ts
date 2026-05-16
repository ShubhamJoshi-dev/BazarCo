import type { Request, Response } from "express";
import type { Types } from "mongoose";
import { errorResponse, successResponse } from "../helpers/response.helper";
import * as videoCommentRepo from "../repositories/videoComment.repository";
import * as videoRepo from "../repositories/sellerVideo.repository";
import * as userRepo from "../repositories/user.repository";

type AuthUser = { id: string };
type ReqWithUser = Request & { user?: AuthUser };

async function displayName(userId: string): Promise<string> {
  const u = await userRepo.findById(userId);
  const name = (u as { name?: string } | null)?.name?.trim();
  if (name) return name;
  const email = (u as { email?: string } | null)?.email ?? "";
  return email.split("@")[0] || "User";
}

function toCommentDto(
  doc: Record<string, unknown> & {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    parentId?: Types.ObjectId | null;
    text: string;
    createdAt: Date;
  },
  userName: string,
  replies: ReturnType<typeof toReplyDto>[] = [],
) {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    userName,
    parentId: doc.parentId?.toString?.() ?? null,
    text: doc.text,
    createdAt: (doc.createdAt as Date).toISOString(),
    replies,
  };
}

function toReplyDto(
  doc: Record<string, unknown> & {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    parentId?: Types.ObjectId;
    text: string;
    createdAt: Date;
  },
  userName: string,
) {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    userName,
    parentId: doc.parentId?.toString?.() ?? null,
    text: doc.text,
    createdAt: (doc.createdAt as Date).toISOString(),
  };
}

export async function listVideoComments(req: ReqWithUser, res: Response): Promise<void> {
  const videoId = req.params.videoId;
  if (!videoId) {
    errorResponse(res, 400, "Video id required");
    return;
  }

  const video = await videoRepo.findPublicById(videoId);
  if (!video) {
    errorResponse(res, 404, "Video not found");
    return;
  }

  const roots = await videoCommentRepo.findRootByVideo(videoId, 80);
  const rootIds = roots.map((r) => (r as { _id: Types.ObjectId })._id.toString());
  const repliesMap = await videoCommentRepo.findRepliesByParentIds(rootIds);

  const authorIds = new Set<string>();
  for (const r of roots) authorIds.add((r as { userId: Types.ObjectId }).userId.toString());
  for (const list of repliesMap.values()) {
    for (const rep of list) authorIds.add((rep as { userId: Types.ObjectId }).userId.toString());
  }
  const names = new Map<string, string>();
  await Promise.all(
    Array.from(authorIds).map(async (uid) => {
      names.set(uid, await displayName(uid));
    }),
  );

  const comments = roots.map((r) => {
    const root = r as Record<string, unknown> & {
      _id: Types.ObjectId;
      userId: Types.ObjectId;
      text: string;
      createdAt: Date;
    };
    const rid = root._id.toString();
    const replyList = (repliesMap.get(rid) ?? []).map((rep) => {
      const d = rep as Record<string, unknown> & {
        _id: Types.ObjectId;
        userId: Types.ObjectId;
        parentId: Types.ObjectId;
        text: string;
        createdAt: Date;
      };
      return toReplyDto(d, names.get(d.userId.toString()) ?? "User");
    });
    return toCommentDto(root, names.get(root.userId.toString()) ?? "User", replyList);
  });

  const total = await videoCommentRepo.countByVideo(videoId);

  successResponse(res, 200, "Comments loaded", { comments, total });
}

export async function createVideoComment(req: ReqWithUser, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }

  const videoId = req.params.videoId;
  const text = typeof req.body.text === "string" ? req.body.text.trim() : "";
  const parentId =
    typeof req.body.parentId === "string" && req.body.parentId.trim()
      ? req.body.parentId.trim()
      : null;

  if (!text) {
    errorResponse(res, 400, "Comment text is required");
    return;
  }

  const video = await videoRepo.findPublicById(videoId);
  if (!video) {
    errorResponse(res, 404, "Video not found");
    return;
  }

  let resolvedParentId: string | null = parentId;
  if (parentId) {
    const parent = await videoCommentRepo.findById(parentId);
    if (!parent) {
      errorResponse(res, 404, "Parent comment not found");
      return;
    }
    if ((parent as { videoId: Types.ObjectId }).videoId.toString() !== videoId) {
      errorResponse(res, 400, "Invalid reply target");
      return;
    }
    const grandparent = (parent as { parentId?: Types.ObjectId | null }).parentId;
    if (grandparent) resolvedParentId = grandparent.toString();
  }

  const created = await videoCommentRepo.createComment({
    videoId,
    userId: user.id,
    text: text.slice(0, 1000),
    parentId: resolvedParentId,
  });

  const userName = await displayName(user.id);
  const dto = resolvedParentId
    ? toReplyDto(created as Parameters<typeof toReplyDto>[0], userName)
    : toCommentDto(created as Parameters<typeof toCommentDto>[0], userName, []);

  const total = await videoCommentRepo.countByVideo(videoId);

  successResponse(res, 201, "Comment added", { comment: dto, total });
}
