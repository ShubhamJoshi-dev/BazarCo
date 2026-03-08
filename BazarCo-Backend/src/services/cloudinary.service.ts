import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env";

if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export function isCloudinaryConfigured(): boolean {
  return !!(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

export async function uploadImage(buffer: Buffer, folder = "bazarco/products"): Promise<string | null> {
  if (!isCloudinaryConfigured()) return null;
  return new Promise((resolve) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => {
        if (err || !result?.secure_url) {
          resolve(null);
          return;
        }
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
}

/** Upload KYC document (e.g. national card, company card). Returns url and publicId for storage. */
export async function uploadDocument(
  buffer: Buffer,
  folder = "bazarco/kyc"
): Promise<{ url: string; publicId: string } | null> {
  if (!isCloudinaryConfigured()) return null;
  return new Promise((resolve) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => {
        if (err || !result?.secure_url || !result?.public_id) {
          resolve(null);
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    uploadStream.end(buffer);
  });
}

/** Delete an image by Cloudinary public_id. Returns true if deleted or not configured. */
export async function deleteByPublicId(publicId: string): Promise<boolean> {
  if (!isCloudinaryConfigured() || !publicId?.trim()) return true;
  return new Promise((resolve) => {
    cloudinary.uploader.destroy(publicId, { resource_type: "image" }, (err) => {
      resolve(!err);
    });
  });
}
