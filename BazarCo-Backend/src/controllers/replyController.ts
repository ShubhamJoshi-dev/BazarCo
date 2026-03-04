import type { Request, Response } from "express";
import { errorResponse, successResponse } from "../helpers/response.helper";
import { ordersRouter } from "../routes/orders";
import { ReviewfindById } from "../repositories/review.repository";
import { replyRepo } from "../repositories/reply.repository";

type ReqWithUser = Request & { user?: { id: string } };
export async function addReply(
    req: ReqWithUser,
    res: Response
): Promise<void> {
    const user = req.user;
    if (!user) {
        errorResponse(res, 401, "Authentication required");
        return;
    }

    const { reviewId } = req.params;
    const { comment, parentReplyId } = req.body;

    const cleanComment =
        typeof comment === "string"
            ? comment.trim().slice(0, 2000)
            : undefined;

    if (!cleanComment) {
        errorResponse(res, 400, "Comment is required");
        return;
    }

    const review = await ReviewfindById(reviewId);
    if (!review) {
        errorResponse(res, 404, "Review not found");
        return;
    }

    // Validate parent reply if provided
    if (parentReplyId) {
        const parent = await replyRepo.findById(parentReplyId);
        if (!parent) {
            errorResponse(res, 404, "Parent reply not found");
            return;
        }
    }

    const created = await replyRepo.create({
        reviewId,
        userId: user.id,
        comment: cleanComment,
        parentReplyId: parentReplyId || null,
    });

    successResponse(res, 201, "Reply added", {
        reply: {
            id: created._id.toString(),
            reviewId: created.reviewId.toString(),
            userId: created.userId.toString(),
            parentReplyId: created.parentReplyId?.toString() ?? null,
            comment: created.comment,
            createdAt: created.createdAt.toISOString(),
        },
    });
}
    
export async function getReplies(
  req: Request,
  res: Response
): Promise<void> {
  const { reviewId } = req.params;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const replies = await replyRepo.findByReview(
    reviewId,
    page,
    limit
  );

  const total = await replyRepo.countByReview(reviewId);

  successResponse(res, 200, "Replies fetched", {
    total,
    page,
    limit,
    replies: replies.map((r: any) => ({
      id: r._id.toString(),
      reviewId: r.reviewId.toString(),
      userId: r.userId.toString(),
      parentReplyId: r.parentReplyId?.toString() ?? null,
      comment: r.comment,
      createdAt: r.createdAt?.toISOString?.(),
    })),
  });
}
