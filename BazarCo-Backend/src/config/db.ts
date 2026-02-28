import mongoose from "mongoose";
import { env } from "./env";
import { DATABASE_CLUSTER_MONGO_ENABLED } from "../constant/database.constant";

function getMongoUri(): string {
  const useAtlas = DATABASE_CLUSTER_MONGO_ENABLED || env.CLUSTER_MONGO_ENABLED;
  if (useAtlas) {
    return env.CLUSTER_MONGO_URI;
  }
  return env.MONGO_URI;
}

export async function connectDb(): Promise<void> {
  const uri = getMongoUri();
  await mongoose.connect(uri);
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
