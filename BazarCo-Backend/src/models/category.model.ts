import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80, unique: true },
  },
  { timestamps: true, collection: "categories" }
);

export const Category = mongoose.model("Category", categorySchema);
