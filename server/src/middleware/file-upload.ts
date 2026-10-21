import type { Request } from "express";
import multer, { type FileFilterCallback } from "multer";
import path from "node:path";
import ApiError from "../err/api-error";
import GLOBAL_ERROR from "../err/error-code";

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const ALLOWED_MIMETYPES = ["image/jpeg", "image/png", "image/webp"];

export function upload(fields: number, files: number, fileSize: number) {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fields,
      fileSize,
      files,
    },
    fileFilter: (
      req: Request,
      file: Express.Multer.File,
      cb: FileFilterCallback,
    ) => {
      const extension = path.extname(file.originalname).toLowerCase();
      const validExtension = ALLOWED_EXTENSIONS.includes(extension);
      const validMimeType = ALLOWED_MIMETYPES.includes(file.mimetype);

      if (validExtension && validMimeType) {
        return cb(null, true);
      }

      cb(new ApiError(GLOBAL_ERROR.FILE_TYPE_MISMATCH));
    },
  });
}
