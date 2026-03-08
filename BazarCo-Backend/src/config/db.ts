import mongoose from "mongoose";
import { env } from "./env";
import { DATABASE_CLUSTER_MONGO_ENABLED } from "../constant/database.constant";
import { Conversation } from "../models/conversation.model";

function getMongoUri(): string {
  const useAtlas = DATABASE_CLUSTER_MONGO_ENABLED || env.CLUSTER_MONGO_ENABLED;
  if (useAtlas) {
    return env.CLUSTER_MONGO_URI;
  }
  return env.MONGO_URI;
}

/** One-time: drop old conversations index that blocked multiple product convos (same buyer+seller). */
async function dropOldConversationOrderIndex(): Promise<void> {
  try {
    await Conversation.collection.dropIndex("orderId_1_buyerId_1_sellerId_1");
  } catch {
    // Index may not exist (new DB) or already dropped
  }
}

export async function connectDb(): Promise<void> {
  const uri = getMongoUri();
  await mongoose.connect(uri);
  await dropOldConversationOrderIndex();
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
