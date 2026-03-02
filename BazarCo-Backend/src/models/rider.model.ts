import mongoose from "mongoose";

const riderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, trim: true, maxlength: 20 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "riders" }
);

export const Rider = mongoose.model("Rider", riderSchema);
