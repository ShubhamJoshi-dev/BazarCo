import mongoose from "mongoose";
import { env } from "./env";

function getMongoUri(): string {
  const useAtlas = env.CLUSTER_MONGO_ENABLED;
  if (useAtlas) {
    if (!env.CLUSTER_MONGO_URI) {
      throw new Error("MONGO_URI_ATLAS is required when CLUSTER_MONGO_ENABLED is true");
    }
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
