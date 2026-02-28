import mongoose from "mongoose";
import { env } from "./env";

function getMongoUri(): string {
  console.log(process.env)
  const useAtlas = env.CLUSTER_MONGO_ENABLED || env.MONGO_URI_ATLAS.length > 0;
  if (useAtlas) {
    if (!env.MONGO_URI_ATLAS) {
      throw new Error("MONGO_URI_ATLAS is required when CLUSTER_MONGO_ENABLED is true");
    }
    return env.MONGO_URI_ATLAS;
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
