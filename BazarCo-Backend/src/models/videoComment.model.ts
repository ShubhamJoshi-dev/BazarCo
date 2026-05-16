import mongoose from "mongoose";

const videoCommentSchema = new mongoose.Schema(
  {
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "SellerVideo", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "VideoComment", default: null },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true, collection: "video_comments" },
);

videoCommentSchema.index({ videoId: 1, parentId: 1, createdAt: -1 });
videoCommentSchema.index({ parentId: 1, createdAt: 1 });

export const VideoComment = mongoose.model("VideoComment", videoCommentSchema);
