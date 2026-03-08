import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  const mimetype = file.mimetype?.toLowerCase?.() ?? "";
  if (mimetype && allowed.includes(mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only images (JPEG, PNG, WebP, GIF) are allowed"));
  }
};

export const uploadSingleImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single("image");

/** Single file upload for KYC document (field name: document) */
export const uploadKycDocument = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single("document");
