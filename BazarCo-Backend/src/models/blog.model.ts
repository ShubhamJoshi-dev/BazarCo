import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 220 },
    excerpt: { type: String, trim: true, maxlength: 500, default: "" },
    content: { type: String, required: true, maxlength: 50000 },
    coverImageUrl: { type: String, trim: true, default: "" },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    published: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "blogs" }
);

blogSchema.index({ published: 1, publishedAt: -1 });
blogSchema.index({ slug: 1 }, { unique: true });

export const Blog = mongoose.model("Blog", blogSchema);
