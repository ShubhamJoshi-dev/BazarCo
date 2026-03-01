import mongoose from "mongoose";

const tagSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60, unique: true },
  },
  { timestamps: true, collection: "tags" }
);

export const Tag = mongoose.model("Tag", tagSchema);
