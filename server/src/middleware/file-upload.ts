import type { Request } from "express";
import multer, { type FileFilterCallback } from "multer";
import path from "node:path";
import ApiError from "../err/api-error";
import ERROR_CODES from "../err/error-code";

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png"];
const ALLOWED_MIMETYPES = ["image/jpeg", "image/png"];

export function upload(files: number, fields: number) {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024,
      files,
      fields,
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

      cb(new ApiError(ERROR_CODES.FILE_TYPE_MISMATCH));
    },
  });
}
