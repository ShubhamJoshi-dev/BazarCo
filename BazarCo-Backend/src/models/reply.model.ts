import mongoose from "mongoose";

const replySchema = new mongoose.Schema(
  {
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    // For conversation (reply to another reply)
    parentReplyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reply",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "replies",
  }
);

// Index for faster fetching of replies per review
replySchema.index({ reviewId: 1, createdAt: 1 });

export const Reply = mongoose.model("Reply", replySchema);