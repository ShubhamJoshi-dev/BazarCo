import fs from "fs";
import path from "path";
import { env } from "../config/env";

export function saveVideoLocally(buffer: Buffer, originalName: string): string | null {
  try {
    const dir = path.join(process.cwd(), "uploads", "videos");
    fs.mkdirSync(dir, { recursive: true });
    const ext = path.extname(originalName) || ".mp4";
    const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    const filePath = path.join(dir, safe);
    fs.writeFileSync(filePath, buffer);
    const base = env.BASE_URL.replace(/\/$/, "");
    return `${base}/uploads/videos/${safe}`;
  } catch {
    return null;
  }
}
