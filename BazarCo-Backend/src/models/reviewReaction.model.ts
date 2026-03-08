import mongoose from "mongoose";

const reviewReactionSchema = new mongoose.Schema(
  {
    reviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Review", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["like", "dislike"], required: true },
  },
  { timestamps: true, collection: "review_reactions" }
);

reviewReactionSchema.index({ reviewId: 1, userId: 1 }, { unique: true });
reviewReactionSchema.index({ reviewId: 1, type: 1 });

export const ReviewReaction = mongoose.model("ReviewReaction", reviewReactionSchema);
