import { Types } from "mongoose";
import { Reply } from "../models/reply.model";

export const replyRepo = {
  /**
   * Create new reply
   */
  async create(data: {
    reviewId: string | Types.ObjectId;
    userId: string | Types.ObjectId;
    comment: string;
    parentReplyId?: string | Types.ObjectId | null;
  }) {
    return Reply.create({
      reviewId: data.reviewId,
      userId: data.userId,
      comment: data.comment,
      parentReplyId: data.parentReplyId || null,
    });
  },

  /**
   * Find reply by id
   */
  async findById(id: string | Types.ObjectId) {
    return Reply.findById(id);
  },

  /**
   * Get replies for a review (paginated)
   */
  async findByReview(
    reviewId: string | Types.ObjectId,
    page = 1,
    limit = 20
  ) {
    const skip = (page - 1) * limit;

    return Reply.find({ reviewId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean();
  },

  /**
   * Count replies for a review
   */
  async countByReview(reviewId: string | Types.ObjectId) {
    return Reply.countDocuments({ reviewId });
  },

  /**
   * Update reply (only owner allowed)
   */
  async update(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    comment: string
  ) {
    return Reply.findOneAndUpdate(
      { _id: id, userId },
      { comment },
      { new: true }
    );
  },

  /**
   * Delete reply (only owner allowed)
   */
  async delete(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId
  ) {
    return Reply.findOneAndDelete({
      _id: id,
      userId,
    });
  },
};